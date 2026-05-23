// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Settings, Trophy, LogOut, Clock, FileText, ArrowRight } from 'lucide-react';

// --- Framer Motion Variants ---
const pageVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function Dashboard() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "mockTests"));
        const testsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTests(testsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tests: ", error);
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      <motion.div 
        className="max-w-6xl p-6 mx-auto md:p-10"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
        {/* --- Top Navbar --- */}
        <motion.div 
          className="flex flex-col items-start justify-between gap-6 pb-8 mb-10 border-b sm:flex-row sm:items-center border-slate-200"
          variants={cardVariants}
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Mock Tests
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Select an assessment to begin or view your rankings.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/admin')} 
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              <Settings className="w-4 h-4" />
              Admin
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/leaderboard')} 
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </motion.button>
          </div>
        </motion.div>

        {/* --- Content Area --- */}
        {loading ? (
          /* Animated Skeleton Loader */
          <motion.div 
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div 
                key={i} 
                variants={cardVariants}
                className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm h-44 flex flex-col justify-between"
              >
                <div>
                  <div className="w-3/4 h-6 mb-4 bg-slate-200 rounded-md animate-pulse" />
                  <div className="w-1/2 h-4 bg-slate-100 rounded-md animate-pulse" />
                </div>
                <div className="w-full h-10 mt-4 bg-slate-100 rounded-xl animate-pulse" />
              </motion.div>
            ))}
          </motion.div>
        ) : tests.length === 0 ? (
          /* Empty State */
          <motion.div 
            variants={cardVariants}
            className="flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed rounded-3xl border-slate-300"
          >
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-slate-50">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No mock tests available</h3>
            <p className="max-w-sm mt-2 text-sm text-slate-500">
              Click the Admin button above to upload your first test JSON and get started.
            </p>
          </motion.div>
        ) : (
          /* Tests Grid */
          <motion.div 
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {tests.map(test => (
              <motion.div 
                key={test.id} 
                variants={cardVariants}
                whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                className="relative flex flex-col justify-between p-6 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm group"
              >
                {/* Subtle gradient accent on hover */}
                <div className="absolute top-0 left-0 w-full h-1 transition-opacity opacity-0 bg-gradient-to-r from-slate-800 to-slate-600 group-hover:opacity-100" />
                
                <div>
                  <h2 className="mb-3 text-xl font-bold tracking-tight text-slate-900 line-clamp-2">
                    {test.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {test.questions?.length || 0} Qs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      2 Hours
                    </span>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/test-details/${test.id}`)}
                  className="flex items-center justify-center w-full gap-2 px-4 py-3 mt-8 text-sm font-semibold text-white transition-colors bg-slate-900 rounded-xl hover:bg-slate-800"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}