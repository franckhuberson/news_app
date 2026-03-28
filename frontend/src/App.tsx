import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';  
import { Dashboard } from './pages/Dashboard';
import { ArticleDetail } from './pages/ArticleDetail';
import { ArticlesByCategory } from './pages/ArticlesByCategory';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
          } 
        />
        <Route path="/article/:id" element={<ArticleDetail />} />
        
        {/* Routes pour les articles par statut et catégorie */}
        <Route 
          path="/admin/articles/:status/:category" 
          element={isAuthenticated ? <ArticlesByCategory /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin/articles/:status" 
          element={isAuthenticated ? <ArticlesByCategory /> : <Navigate to="/login" />} 
        />

        {/* Pages Statistiques et Paramètres */}
        <Route 
          path="/admin/stats" 
          element={isAuthenticated ? <Stats /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin/settings" 
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;