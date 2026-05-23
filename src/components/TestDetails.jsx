// src/components/TestDetails.jsx

import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  ArrowLeft,
  PlayCircle,
  History,
  Clock,
  Target,
  Trophy,
  Medal,
  Award,
  BarChart2
} from 'lucide-react';

// ---------------- Framer Motion Variants ----------------

const pageVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      staggerChildren: 0.1
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

const tableContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export default function TestDetails() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- Fetch Results ----------------

  useEffect(() => {
    const fetchSpecificTestResults = async () => {
      try {
        const q = query(
          collection(db, 'results'),
          where('testId', '==', testId)
        );

        const querySnapshot = await getDocs(q);

        let allResults = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort leaderboard by highest score
        allResults.sort((a, b) => b.totalScore - a.totalScore);

        setResults(allResults);

        // Filter current user's attempts
        if (auth.currentUser) {
          const userAttempts = allResults
            .filter((r) => r.userId === auth.currentUser.uid)
            .sort((a, b) => {
              const timeA = a.createdAt?.seconds || 0;
              const timeB = b.createdAt?.seconds || 0;

              return timeB - timeA;
            });

          setMyAttempts(userAttempts);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching test details:', error);
        setLoading(false);
      }
    };

    fetchSpecificTestResults();
  }, [testId]);

  // ---------------- Rank UI ----------------

  const renderRank = (index) => {
    if (index === 0) {
      return (
        <div className="flex items-center gap-2 font-bold text-amber-500">
          <Trophy className="w-5 h-5" />
          1st
        </div>
      );
    }

    if (index === 1) {
      return (
        <div className="flex items-center gap-2 font-bold text-slate-400">
          <Medal className="w-5 h-5" />
          2nd
        </div>
      );
    }

    if (index === 2) {
      return (
        <div className="flex items-center gap-2 font-bold text-amber-700">
          <Award className="w-5 h-5" />
          3rd
        </div>
      );
    }

    return (
      <span className="pl-2 font-medium text-slate-500">
        #{index + 1}
      </span>
    );
  };

  // ---------------- Loading ----------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-700">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 font-sans md:p-8 bg-slate-50 text-slate-900">

      <motion.div
        className="max-w-6xl mx-auto space-y-8"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >

        {/* ---------------- Back Button ---------------- */}

        <motion.button
          variants={sectionVariants}
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium transition-colors text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </motion.button>

        {/* ---------------- Test Overview ---------------- */}

        <motion.div
          variants={sectionVariants}
          className="relative flex flex-col items-center justify-between p-6 overflow-hidden bg-white border shadow-sm md:flex-row md:p-8 rounded-3xl border-slate-200 group"
        >
          <div className="absolute top-0 left-0 w-full h-1 transition-opacity opacity-0 bg-gradient-to-r from-slate-800 to-slate-400 group-hover:opacity-100" />

          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Mock Test Overview
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium text-slate-500">

              <span className="flex items-center gap-1.5 px-3 py-1 border rounded-lg bg-slate-50 border-slate-100">
                <Clock className="w-4 h-4 text-slate-400" />
                2 Hours
              </span>

              <span className="flex items-center gap-1.5 px-3 py-1 border rounded-lg bg-slate-50 border-slate-100">
                <Target className="w-4 h-4 text-slate-400" />
                1 Mark / Question
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/test/${testId}`)}
            className="flex items-center justify-center w-full gap-2 px-8 py-4 text-base font-bold text-white shadow-md md:w-auto bg-slate-900 rounded-xl hover:bg-slate-800"
          >
            <PlayCircle className="w-5 h-5" />
            Start Assessment
          </motion.button>
        </motion.div>

        {/* ---------------- My Attempts ---------------- */}

        {myAttempts.length > 0 && (
          <motion.div variants={sectionVariants} className="space-y-4">

            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <History className="w-5 h-5 text-slate-400" />
              My Previous Attempts
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

              {myAttempts.map((attempt, idx) => {
                const scores = attempt.subjectScores || {};

                return (
                  <motion.div
                    key={attempt.id}
                    whileHover={{ y: -2 }}
                    className="p-5 transition-all bg-white border shadow-sm border-slate-200 rounded-2xl hover:shadow-md"
                  >

                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">

                      <span className="text-sm font-bold tracking-wider uppercase text-slate-500">
                        Attempt {idx + 1}
                      </span>

                      <span className="px-3 py-1 text-sm font-bold text-white rounded-full shadow-sm bg-slate-900">
                        {attempt.totalScore} pts
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-xs font-medium text-center text-slate-600">

                      <div className="py-2 border rounded-lg bg-slate-50 border-slate-100">
                        <span className="block text-[10px] uppercase text-slate-400">
                          Maths
                        </span>
                        {scores.Maths || 0}
                      </div>

                      <div className="py-2 border rounded-lg bg-slate-50 border-slate-100">
                        <span className="block text-[10px] uppercase text-slate-400">
                          Reasoning
                        </span>
                        {scores['Reasoning & Apti'] || 0}
                      </div>

                      <div className="py-2 border rounded-lg bg-slate-50 border-slate-100">
                        <span className="block text-[10px] uppercase text-slate-400">
                          English
                        </span>
                        {scores.English || 0}
                      </div>

                      <div className="py-2 border rounded-lg bg-slate-50 border-slate-100">
                        <span className="block text-[10px] uppercase text-slate-400">
                          GK
                        </span>
                        {scores.GK || 0}
                      </div>

                      <div className="py-2 border rounded-lg bg-slate-50 border-slate-100">
                        <span className="block text-[10px] uppercase text-slate-400">
                          Computer
                        </span>
                        {scores.Computer || 0}
                      </div>

                    </div>
                  </motion.div>
                );
              })}

            </div>
          </motion.div>
        )}

        {/* ---------------- Leaderboard ---------------- */}

        <motion.div
          variants={sectionVariants}
          className="overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200"
        >

          <div className="flex items-center gap-2 px-6 py-5 border-b bg-slate-50/80 border-slate-200">

            <BarChart2 className="w-5 h-5 text-slate-700" />

            <h2 className="text-lg font-bold text-slate-800">
              Local Leaderboard
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center">

              <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-200" />

              <p className="font-medium text-slate-500">
                No one has taken this test yet.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left border-collapse whitespace-nowrap">

                <thead className="bg-white border-b border-slate-100">
                  <tr>

                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-500">
                      Rank
                    </th>

                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase text-slate-500">
                      Candidate
                    </th>

                    <th className="px-6 py-4 text-xs font-extrabold tracking-wider uppercase text-slate-900">
                      Total
                    </th>

                    <th className="px-6 py-4 text-xs uppercase text-slate-400">
                      Maths
                    </th>

                    <th className="px-6 py-4 text-xs uppercase text-slate-400">
                      Reasoning
                    </th>

                    <th className="px-6 py-4 text-xs uppercase text-slate-400">
                      English
                    </th>

                    <th className="px-6 py-4 text-xs uppercase text-slate-400">
                      GK
                    </th>

                    <th className="px-6 py-4 text-xs uppercase text-slate-400">
                      Computer
                    </th>

                  </tr>
                </thead>

                <motion.tbody
                  variants={tableContainerVariants}
                  initial="hidden"
                  animate="visible"
                >

                  {results.map((result, index) => {
                    const scores = result.subjectScores || {};

                    const isTop3 = index < 3;

                    return (
                      <motion.tr
                        key={result.id}
                        variants={rowVariants}
                        className="transition-colors border-b border-slate-50 hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">
                          {renderRank(index)}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {result.userName}
                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                              isTop3
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {result.totalScore} pts
                          </span>

                        </td>

                        <td className="px-6 py-4">
                          {scores.Maths || 0}
                        </td>

                        <td className="px-6 py-4">
                          {scores['Reasoning & Apti'] || 0}
                        </td>

                        <td className="px-6 py-4">
                          {scores.English || 0}
                        </td>

                        <td className="px-6 py-4">
                          {scores.GK || 0}
                        </td>

                        <td className="px-6 py-4">
                          {scores.Computer || 0}
                        </td>

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