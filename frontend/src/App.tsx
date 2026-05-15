import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';  
import { Dashboard } from './pages/Dashboard';
import { ArticleDetail } from './pages/ArticleDetail';
import { ArticlesByCategory } from './pages/ArticlesByCategory';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
// ✅ Import du composant ScheduledArticles
import { ScheduledArticles } from './pages/ScheduledArticles';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    setIsAuthenticated(!!token);
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.email === 'admin@axio.com' && user.role !== 'admin') {
          user.role = 'admin';
          localStorage.setItem('user', JSON.stringify(user));
        }
        setIsAdmin(user.role === 'admin');
        console.log('👤 Utilisateur:', user.email, '- Rôle:', user.role);
      } catch (e) {
        console.error('Erreur parsing user:', e);
        setIsAdmin(false);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4500]"></div>
      </div>
    );
  }

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/article/:id" element={<ArticleDetail />} />
        
        {/* Routes admin protégées */}
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* ARTICLES - En attente */}
        <Route path="/admin/articles/pending/:category" element={<ProtectedRoute><ArticlesByCategory /></ProtectedRoute>} />
        <Route path="/admin/articles/pending" element={<ProtectedRoute><ArticlesByCategory /></ProtectedRoute>} />
        
        {/* ARTICLES - Publiés */}
        <Route path="/admin/articles/published/:category" element={<ProtectedRoute><ArticlesByCategory /></ProtectedRoute>} />
        <Route path="/admin/articles/published" element={<ProtectedRoute><ArticlesByCategory /></ProtectedRoute>} />
        
        {/* ARTICLES - Rejetés */}
        <Route path="/admin/articles/rejected/:category" element={<ProtectedRoute><ArticlesByCategory /></ProtectedRoute>} />
        <Route path="/admin/articles/rejected" element={<ProtectedRoute><ArticlesByCategory /></ProtectedRoute>} />
        
        {/* ✅ ARTICLES - Programmés */}
        <Route path="/admin/articles/scheduled" element={<ProtectedRoute><ScheduledArticles /></ProtectedRoute>} />
        
        {/* STATISTIQUES */}
        <Route path="/admin/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        
        {/* PARAMÈTRES */}
        <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;