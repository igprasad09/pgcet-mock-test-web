// src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Import all components
import Login from './components/Login';
import Admin from './components/Admin';
import TestEngine from './components/TestEngine';
import Dashboard from './components/Dashboard'; 
import Leaderboard from './components/Leaderboard';
import TestDetails from './components/TestDetails';
import { Helmet } from "react-helmet-async";

<Helmet>
  <title>PGCET MCA Mock Tests</title>

  <meta
    name="description"
    content="Free Karnataka PGCET MCA mock tests with leaderboard and analytics."
  />

  <meta
    name="keywords"
    content="PGCET MCA, mock test, Karnataka MCA entrance, MCA preparation"
  />
</Helmet>
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-600">Loading App...</h2>
      </div>
    );
  }

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route path="/admin" element={<Admin />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/test/:testId"
        element={
          <ProtectedRoute>
            <TestEngine />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />

      <Route 
          path="/test-details/:testId" 
          element={
            <ProtectedRoute>
              <TestDetails />
            </ProtectedRoute>
          } 
        />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}