// src/components/TestEngine.jsx
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  PlayCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Send,
  FileText
} from 'lucide-react';

// --- Framer Motion Variants ---
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24, staggerChildren: 0.1 }
  }
};

const questionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export default function TestEngine() {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [hasStarted, setHasStarted] = useState(false);
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null); // { score, total }

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const docRef = doc(db, "mockTests", testId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTest({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching test:", error);
      }
    };
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (hasStarted && timeLeft > 0 && !isSubmitting && !submissionResult) {
      const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timerId);
    } else if (timeLeft === 0 && hasStarted && !isSubmitting && !submissionResult) {
      handleSubmit(); // Auto-submit when time is up
    }
  }, [hasStarted, timeLeft, isSubmitting, submissionResult]);

  const handleSelectOption = (qIndex, optionIndex) => {
    setAnswers({ ...answers, [qIndex]: optionIndex });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let analytics = { Maths: 0, "Reasoning & Apti": 0, English: 0, GK: 0, Computer: 0 };
    
    test.questions.forEach((q, index) => {
      if (Number(answers[index]) === Number(q.answerIndex)) {
        if (analytics[q.subject] !== undefined) {
          analytics[q.subject] += 1;
        }
      }
    });

    const totalScore = Object.values(analytics).reduce((sum, current) => sum + current, 0);

    try {
      await addDoc(collection(db, "results"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
        testId: test.id,
        testTitle: test.title,
        totalScore: totalScore,
        subjectScores: analytics,
        timestamp: new Date()
      });

      // Show success screen instead of alert
      setSubmissionResult({ score: totalScore, total: test.questions.length });
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate(`/test-details/${test.id}`);
      }, 3000);

    } catch (error) {
      console.error("Submission failed:", error);
      setIsSubmitting(false);
    }
  };

  // Helper to format time as HH:MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Loading State
  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
          <p className="text-sm font-medium animate-pulse">Initializing Assessment Environment...</p>
        </div>
      </div>
    );
  }

  // 2. Success/Result Screen Overlay
  if (submissionResult) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-900">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center p-10 text-center bg-white shadow-xl border border-slate-200 rounded-3xl"
        >
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: "spring", delay: 0.2 }}
          >
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight">Assessment Submitted!</h1>
          <p className="mt-2 text-slate-500">Your responses have been successfully recorded.</p>
          
          <div className="mt-8 py-4 px-8 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Final Score</p>
            <p className="text-4xl font-black text-slate-900">
              {submissionResult.score} <span className="text-xl text-slate-400 font-medium">/ {submissionResult.total}</span>
            </p>
          </div>

          <p className="mt-8 text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to detailed analytics...
          </p>
        </motion.div>
      </div>
    );
  }

  // 3. Pre-Start Screen
  if (!hasStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 text-slate-900 selection:bg-slate-200">
        <motion.div 
          className="w-full max-w-xl p-8 bg-white border border-slate-200 shadow-sm rounded-3xl"
          initial="hidden"
          animate="visible"
          variants={pageVariants}
        >
          <div className="flex items-center justify-center w-16 h-16 mb-6 bg-slate-100 rounded-2xl">
            <FileText className="w-8 h-8 text-slate-700" />
          </div>
          
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight">{test.title}</h1>
          
          <div className="flex items-center gap-4 mt-4 mb-8 text-sm font-medium text-slate-500 border-b border-slate-100 pb-8">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <Clock className="w-4 h-4" /> 2 Hours
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="w-4 h-4" /> {test.questions?.length || 0} Questions
            </span>
          </div>

          <div className="p-4 mb-8 text-sm leading-relaxed border rounded-xl bg-amber-50 text-amber-800 border-amber-200 flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold mb-1">Important Instructions</p>
              <ul className="list-disc pl-4 space-y-1 text-amber-700/90">
                <li>The timer cannot be paused once started.</li>
                <li>Do not refresh the page, or your progress will be lost.</li>
                <li>The test will auto-submit when the time expires.</li>
              </ul>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setHasStarted(true)} 
            className="flex items-center justify-center w-full gap-2 py-4 text-base font-bold text-white transition-colors bg-slate-900 rounded-xl hover:bg-slate-800 shadow-md"
          >
            <PlayCircle className="w-5 h-5" /> Begin Assessment
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Calculate Progress
  const progressPercentage = (Object.keys(answers).length / test.questions.length) * 100;
  const isTimeLow = timeLeft < 300; // Under 5 minutes

  // 4. Main Test Engine UI
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl px-6 py-4 mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight line-clamp-1">{test.title}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">
              Attempting {Object.keys(answers).length} of {test.questions.length}
            </p>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 font-mono text-lg font-bold rounded-xl border ${
            isTimeLow 
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
              : 'bg-slate-50 text-slate-800 border-slate-200'
          }`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-100">
          <div 
            className="h-full bg-slate-900 transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* --- Questions List --- */}
      <div className="max-w-4xl p-6 mx-auto mt-6">
        <motion.div 
          className="space-y-8"
          initial="hidden"
          animate="visible"
          variants={pageVariants}
        >
          {test.questions.map((q, qIndex) => (
            <motion.div 
              key={qIndex} 
              variants={questionVariants}
              className="p-6 md:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm"
              id={`question-${qIndex}`}
            >
              <div className="flex items-start gap-4 mb-6">
                <span className="flex items-center justify-center w-8 h-8 text-sm font-bold bg-slate-100 text-slate-500 rounded-lg shrink-0 mt-0.5">
                  {qIndex + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold leading-relaxed text-slate-900">
                    {q.question}
                  </h3>
                  <span className="inline-block mt-3 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase bg-slate-100 rounded-md">
                    {q.subject}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3 pl-0 md:pl-12">
                {q.options.map((opt, optIndex) => {
                  const isSelected = answers[qIndex] === optIndex;
                  return (
                    <label 
                      key={optIndex} 
                      className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name={`question-${qIndex}`} 
                        className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                        checked={isSelected}
                        onChange={() => handleSelectOption(qIndex, optIndex)}
                      />
                      <span className={`ml-3 text-sm ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* --- Submit Section --- */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-white transition-colors bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-70 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" /> Submitting Assessment...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Submit Assessment
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}