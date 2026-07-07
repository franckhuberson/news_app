import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ArticleDetail } from './pages/ArticleDetail';
import { ArticlesByCategory } from './pages/ArticlesByCategory';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { ScheduledArticles } from './pages/ScheduledArticles';
import { WriteArticle } from './pages/WriteArticle'; // ← AJOUTER CETTE LIGNE
import { DashboardLayout } from './components/layout/DashboardLayout'; // ← AJOUTER CETTE LIGNE

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);

  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    const userStr = localStorage.getItem('user');

    setIsAuthenticated(!!token);

    if (userStr) {
      try {
        const user = JSON.parse(userStr);

        // Force admin
        if (
          user.email === 'admin@axio.com' &&
          user.role !== 'admin'
        ) {
          user.role = 'admin';

          localStorage.setItem(
            'user',
            JSON.stringify(user)
          );
        }

        setIsAdmin(user.role === 'admin');

        console.log(
          '👤 Utilisateur:',
          user.email,
          '- Rôle:',
          user.role
        );
      } catch (error) {
        console.error(
          '❌ Erreur parsing user:',
          error
        );

        setIsAdmin(false);
      }
    }

    setLoading(false);
  }, []);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  // =========================
  // PROTECTED ROUTE
  // =========================

  const ProtectedRoute = ({
    children
  }: {
    children: React.ReactNode;
  }) => {
    if (!isAuthenticated || !isAdmin) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  };

  // =========================
  // ROUTER
  // =========================

  return (
    <Router>
      <Routes>

        {/* ========================= */}
        {/* ROUTES PUBLIQUES */}
        {/* ========================= */}

        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/article/:id"
          element={<ArticleDetail />}
        />

        {/* ========================= */}
        {/* DASHBOARD ADMIN */}
        {/* ========================= */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* ARTICLES */}
        {/* ========================= */}

        <Route
          path="/admin/articles/:status/:category?"
          element={
            <ProtectedRoute>
              <ArticlesByCategory />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* ARTICLES PROGRAMMÉS */}
        {/* ========================= */}

        <Route
          path="/admin/articles/scheduled"
          element={
            <ProtectedRoute>
              <ScheduledArticles />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* RÉDIGER UN ARTICLE - NOUVEAU */}
        {/* ========================= */}

        <Route
          path="/admin/articles/write"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <WriteArticle />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* STATS */}
        {/* ========================= */}

        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute>
              <Stats />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* SETTINGS */}
        {/* ========================= */}

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* FALLBACK */}
        {/* ========================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;