import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, EyeOff, Lock, Mail, ChevronLeft } from 'lucide-react'; // Installez lucide-react
import logo from '../assets/logo.png'; // Si tu veux ajouter ton logo

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        navigate('/admin');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Cercles décoratifs en arrière-plan - adaptés à ta couleur */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF4500]/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#FF4500]/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-[440px] animate-in fade-in zoom-in duration-500">
        {/* Lien de retour discret */}
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#FF4500] transition-colors mb-8 group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Retour au journal
        </Link>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative">
          {/* Ligne signature avec ta couleur orange */}
          <div className="h-1.5 w-full bg-[#FF4500]"></div>

          <div className="p-10">
            <header className="text-center mb-10">
              {/* Logo (optionnel) */}
              {logo && (
                <div className="flex justify-center mb-4">
                  <img src={logo} alt="NewsPulse" className="h-10 w-auto" />
                </div>
              )}
              <h1 className="text-4xl font-black uppercase tracking-tighter dark:text-white mb-2">
                Admin<span className="text-[#FF4500]">.</span>
              </h1>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.2em]">
                Console de Rédaction
              </p>
            </header>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="animate-shake bg-[#FF4500]/10 dark:bg-[#FF4500]/20 text-[#FF4500] border-l-2 border-[#FF4500] p-4 text-[11px] font-bold uppercase tracking-wider">
                  {error}
                </div>
              )}

              {/* Champ Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Professionnel</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4500] transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-[#FF4500] outline-none transition-all dark:text-white text-sm"
                    placeholder="nom@newspulse.fr"
                    required
                  />
                </div>
              </div>

              {/* Champ Mot de passe */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mot de passe</label>
                  <button type="button" className="text-[10px] font-bold text-[#FF4500] hover:underline">Oublié ?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF4500] transition-colors" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-[#FF4500] outline-none transition-all dark:text-white text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Se souvenir de moi */}
              <label className="flex items-center gap-2 cursor-pointer group w-fit">
                <input type="checkbox" className="w-4 h-4 border-gray-300 rounded accent-[#FF4500]" />
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-600 uppercase tracking-wide">Rester connecté</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black dark:bg-white dark:text-black text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#FF4500] dark:hover:bg-[#FF4500] dark:hover:text-white transition-all duration-500 shadow-xl shadow-[#FF4500]/10 disabled:opacity-50 mt-4 active:scale-[0.98]"
              >
                {loading ? 'Authentification...' : 'Accéder au Dashboard'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
          Système réservé au personnel autorisé <br/> 
          <span className="text-gray-300 dark:text-gray-700">© 2024 NewsPulse Media Group</span>
        </p>
      </div>
    </div>
  );
};