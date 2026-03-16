import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';  // ← IMPORTANT

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    navigate('/admin');  

    try {
      // Connexion via le vrai endpoint
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        // Stocker le token et l'utilisateur
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        navigate('/admin');
      }
    } catch (error: any) {
      console.error('Erreur login:', error);
      setError(error.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-white/30 p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent text-center mb-8">
          NewsPulse Admin
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-rose-500/20 text-rose-700 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 focus:border-primary-500 outline-none"
              placeholder="admin@test.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 focus:border-primary-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};