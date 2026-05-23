// src/components/Admin.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  UploadCloud, 
  FileJson, 
  Type, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Trash2,
  List,
  Database,
  LayoutDashboard
} from 'lucide-react';

// --- Framer Motion Variants ---
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24, staggerChildren: 0.1 }
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function Admin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manage'
  
  // Upload States
  const [jsonInput, setJsonInput] = useState('');
  const [testTitle, setTestTitle] = useState('');
  
  // Manage States
  const [existingTests, setExistingTests] = useState([]);
  const [isFetchingTests, setIsFetchingTests] = useState(false);
  
  // UI States
  const [loginError, setLoginError] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();

  // Fetch Tests whenever the Manage tab is opened
  useEffect(() => {
    if (isAuthenticated && activeTab === 'manage') {
      fetchTests();
    }
  }, [isAuthenticated, activeTab]);

  const fetchTests = async () => {
    setIsFetchingTests(true);
    try {
      const querySnapshot = await getDocs(collection(db, "mockTests"));
      const testsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort newest first
      testsData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setExistingTests(testsData);
    } catch (error) {
      showStatus('error', 'Failed to fetch tests: ' + error.message);
    } finally {
      setIsFetchingTests(false);
    }
  };

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (username === 'prasad' && password === '8722') {
      setIsAuthenticated(true);
    } else {
      setLoginError('Invalid admin credentials. Please try again.');
    }
  };

  // --- UPLOAD LOGIC ---
  const handleUpload = async () => {
    setStatus({ type: '', message: '' });
    
    if (!testTitle.trim() || !jsonInput.trim()) {
      showStatus('error', 'Please provide both a title and JSON data.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const questionsData = JSON.parse(jsonInput);
      
      if (!Array.isArray(questionsData)) {
        throw new Error("JSON must be an array of question objects.");
      }

      await addDoc(collection(db, "mockTests"), {
        title: testTitle,
        questions: questionsData,
        createdAt: new Date()
      });
      
      showStatus('success', 'Mock Test uploaded successfully!');
      setJsonInput('');
      setTestTitle('');
      
    } catch (error) {
      showStatus('error', 'Invalid JSON format: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- DELETE LOGIC ---
  const handleDeleteTest = async (testId, testName) => {
    if (!window.confirm(`Are you sure you want to delete "${testName}"? This will also delete ALL student results and leaderboards for this test.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Delete the test document
      await deleteDoc(doc(db, "mockTests", testId));

      // 2. Find and delete all results tied to this test
      const resultsQuery = query(collection(db, "results"), where("testId", "==", testId));
      const resultsSnapshot = await getDocs(resultsQuery);
      
      const batch = writeBatch(db);
      resultsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      showStatus('success', `Test "${testName}" and ${resultsSnapshot.docs.length} associated results deleted.`);
      fetchTests(); // Refresh the list
    } catch (error) {
      showStatus('error', 'Failed to delete test: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearGlobalLeaderboard = async () => {
    if (!window.confirm(`DANGER: Are you sure you want to delete ALL results across ALL tests? This will empty the global leaderboard entirely.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const resultsSnapshot = await getDocs(collection(db, "results"));
      const batch = writeBatch(db);
      
      resultsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      showStatus('success', `Successfully wiped ${resultsSnapshot.docs.length} records from the global leaderboard.`);
    } catch (error) {
      showStatus('error', 'Failed to clear leaderboard: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 flex flex-col items-center p-4">
      
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* --- LOGIN VIEW --- */
          <motion.div 
            key="login"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-md p-8 mt-20 bg-white border border-slate-200 rounded-3xl shadow-sm"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 mb-4 bg-slate-900 rounded-2xl shadow-inner">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Admin Portal</h2>
              <p className="text-sm text-slate-500 mt-1">Authenticate to manage tests</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{loginError}</p>
                </motion.div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    placeholder="Enter username" 
                    value={username}
                    onChange={e => setUsername(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="password" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    placeholder="Enter password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)} 
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3 mt-4 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-md"
              >
                Secure Login
              </motion.button>

              <button 
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Return to Dashboard
              </button>
            </form>
          </motion.div>

        ) : (

          /* --- DASHBOARD VIEW --- */
          <motion.div 
            key="dashboard"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-4xl mt-10"
          >
            {/* Top Bar */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to App
                </button>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Command Center</h2>
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-slate-200 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <UploadCloud className="w-4 h-4" /> Upload
                </button>
                <button 
                  onClick={() => setActiveTab('manage')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'manage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Manage
                </button>
              </div>
            </motion.div>

            {/* Global Status Message */}
            <AnimatePresence>
              {status.message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }} 
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-3 p-4 mb-6 rounded-xl border overflow-hidden ${
                    status.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {status.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                  )}
                  <p className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                    {status.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- UPLOAD TAB CONTENT --- */}
            {activeTab === 'upload' && (
              <motion.div variants={itemVariants} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Type className="w-4 h-4 text-slate-400" /> Test Title
                  </label>
                  <input 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all" 
                    placeholder="e.g. NIMCET Grand Mock 2024" 
                    value={testTitle} 
                    onChange={e => setTestTitle(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <FileJson className="w-4 h-4 text-slate-400" /> JSON Question Data
                    </label>
                  </div>
                  <textarea 
                    className="w-full h-80 p-4 font-mono text-sm leading-relaxed text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all resize-y" 
                    placeholder={'[\n  {\n    "question": "What is the capital of France?",\n    "options": ["London", "Paris", "Berlin", "Madrid"],\n    "answerIndex": 1,\n    "subject": "General Knowledge"\n  }\n]'}
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                    spellCheck={false}
                  />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload} 
                  disabled={isProcessing}
                  className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-70 shadow-md"
                >
                  {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><UploadCloud className="w-5 h-5" /> Publish Test</>}
                </motion.button>
              </motion.div>
            )}

            {/* --- MANAGE TAB CONTENT --- */}
            {activeTab === 'manage' && (
              <motion.div variants={itemVariants} className="space-y-6">
                
                {/* Global Actions */}
                <div className="p-6 bg-red-50 border border-red-200 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2"><Database className="w-5 h-5" /> Danger Zone</h3>
                    <p className="text-sm text-red-600 mt-1">Permanently wipe all student results across all tests.</p>
                  </div>
                  <button 
                    onClick={handleClearGlobalLeaderboard}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Clear Global Leaderboard
                  </button>
                </div>

                {/* Tests List */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                    <List className="w-5 h-5 text-slate-500" />
                    <h3 className="text-lg font-bold text-slate-800">Active Mock Tests</h3>
                  </div>
                  
                  {isFetchingTests ? (
                    <div className="p-10 flex justify-center text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : existingTests.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">No mock tests found in the database.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {existingTests.map((test) => (
                        <div key={test.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg">{test.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">
                              ID: <span className="font-mono text-xs">{test.id}</span> • {test.questions?.length || 0} Questions
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteTest(test.id, test.title)}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Test
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}