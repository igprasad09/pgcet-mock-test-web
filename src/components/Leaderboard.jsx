// src/components/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  ArrowLeft, 
  BarChart3, 
  Inbox
} from 'lucide-react';

// --- Framer Motion Variants ---
const pageVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 }
  }
};

const tableContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export default function Leaderboard() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const resultsRef = collection(db, "results");
        const q = query(resultsRef, orderBy("totalScore", "desc"));
        const querySnapshot = await getDocs(q);
        
        const resultsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setResults(resultsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching results: ", error);
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  // Helper function to render Top 3 Icons
  const renderRank = (index) => {
    if (index === 0) return <div className="flex items-center gap-2 text-amber-500 font-bold"><Trophy className="w-5 h-5" /> 1st</div>;
    if (index === 1) return <div className="flex items-center gap-2 text-slate-400 font-bold"><Medal className="w-5 h-5" /> 2nd</div>;
    if (index === 2) return <div className="flex items-center gap-2 text-amber-700 font-bold"><Award className="w-5 h-5" /> 3rd</div>;
    return <span className="text-slate-500 font-medium pl-2">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 p-4 md:p-8">
      <motion.div 
        className="max-w-7xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
        {/* --- Top Header --- */}
        <motion.div variants={rowVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-slate-700" />
              Global Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Real-time rankings and subject-wise performance across all candidates.
            </p>
          </div>
        </motion.div>

        {/* --- Data Table Section --- */}
        <motion.div 
          variants={rowVariants}
          className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
        >
          {loading ? (
            /* Animated Skeleton Loader */
            <div className="w-full p-4">
              <div className="w-full flex justify-between px-6 py-3 border-b border-slate-100">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-4 bg-slate-100 rounded w-16 animate-pulse" />)}
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full flex justify-between px-6 py-5 border-b border-slate-50">
                  <div className="h-5 bg-slate-200 rounded w-8 animate-pulse" />
                  <div className="h-5 bg-slate-100 rounded w-32 animate-pulse" />
                  <div className="h-5 bg-slate-100 rounded w-24 animate-pulse" />
                  <div className="h-5 bg-slate-200 rounded w-12 animate-pulse" />
                  <div className="h-5 bg-slate-50 rounded w-48 animate-pulse" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-slate-50">
                <Inbox className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No results recorded yet</h3>
              <p className="max-w-sm mt-2 text-sm text-slate-500">
                Be the first candidate to take a test and secure the #1 spot on the leaderboard!
              </p>
            </div>
          ) : (
            /* Animated Table */
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Test Taken</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-900 uppercase tracking-wider">Total Score</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Maths</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reasoning</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">English</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">GK</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Computer</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={tableContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {results.map((result, index) => {
                    const scores = result.subjectScores || { Maths: 0, "Reasoning & Apti": 0, English: 0, GK: 0, Computer: 0 };
                    
                    // Style top 3 rows slightly differently
                    const isTop3 = index < 3;
                    const rowBg = index === 0 ? 'bg-amber-50/30' : index === 1 ? 'bg-slate-50/50' : 'bg-white';

                    return (
                      <motion.tr 
                        key={result.id} 
                        variants={rowVariants}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${rowBg}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderRank(index)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {result.userName}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-[200px]">
                          {result.testTitle}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                            isTop3 ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {result.totalScore} pts
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{scores.Maths || 0}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{scores["Reasoning & Apti"] || 0}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{scores.English || 0}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{scores.GK || 0}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{scores.Computer || 0}</td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}