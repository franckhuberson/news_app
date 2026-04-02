import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, EyeOff, Lock, Mail, X, Loader2, KeyRound } from 'lucide-react';
import logo from '../assets/logo.png';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // États pour la réinitialisation
  const [showResetModal, setShowResetModal] = useState(false);
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // ÉTAPE 1: Demander le code
  const handleRequestCode = async () => {
    if (!resetEmail) {
      setMessage({ text: 'Veuillez entrer votre email', type: 'error' });
      return;
    }

    setLoadingAction(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/forgot-password', { email: resetEmail });
      
      if (response.data.success) {
        setMessage({ text: 'Un code a été envoyé à votre email', type: 'success' });
        setTimeout(() => {
          setMessage(null);
          setStep('code');
        }, 1500);
      } else {
        setMessage({ text: response.data.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'Erreur', type: 'error' });
    } finally {
      setLoadingAction(false);
    }
  };

  // ÉTAPE 2: Vérifier le code
  const handleVerifyCode = async () => {
    if (!resetCode) {
      setMessage({ text: 'Veuillez entrer le code', type: 'error' });
      return;
    }

    setLoadingAction(true);
    setMessage(null);

    try {
      // Vérifier le code (sans changer le mot de passe)
      const response = await api.post('/auth/verify-code', { email: resetEmail, code: resetCode });
      
      if (response.data.success) {
        setMessage({ text: 'Code vérifié !', type: 'success' });
        setTimeout(() => {
          setMessage(null);
          setStep('password');
        }, 1000);
      } else {
        setMessage({ text: response.data.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'Code invalide', type: 'error' });
    } finally {
      setLoadingAction(false);
    }
  };

  // ÉTAPE 3: Changer le mot de passe
  const handleResetPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setMessage({ text: 'Veuillez remplir tous les champs', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'Le mot de passe doit contenir au moins 6 caractères', type: 'error' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage({ text: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }

    setLoadingAction(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/reset-password', {
        email: resetEmail,
        newPassword
      });

      if (response.data.success) {
        setMessage({ text: 'Mot de passe réinitialisé avec succès !', type: 'success' });
        setTimeout(() => {
          setShowResetModal(false);
          setStep('email');
          setResetEmail('');
          setResetCode('');
          setNewPassword('');
          setConfirmNewPassword('');
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ text: response.data.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'Erreur', type: 'error' });
    } finally {
      setLoadingAction(false);
    }
  };

  const closeModal = () => {
    setShowResetModal(false);
    setStep('email');
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setMessage(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="h-2 bg-[#FF4500]"></div>
            
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <img src={logo} alt="NewsPulse" className="h-12 w-auto" />
              </div>

              <h1 className="text-2xl font-bold text-center mb-2 dark:text-white">
                Espace Admin
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
                Connectez-vous pour accéder au dashboard
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-[#FF4500] text-[#FF4500] text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] outline-none transition-colors dark:text-white"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] outline-none transition-colors dark:text-white"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-[#FF4500] focus:ring-[#FF4500]" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Se souvenir de moi</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowResetModal(true)}
                    className="text-sm text-[#FF4500] hover:text-[#E03D00] transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Axio News. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* MODAL RÉINITIALISATION - 3 ÉTAPES */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full overflow-hidden">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                {step === 'email' && <Mail size={20} className="text-[#FF4500]" />}
                {step === 'code' && <KeyRound size={20} className="text-[#FF4500]" />}
                {step === 'password' && <Lock size={20} className="text-[#FF4500]" />}
                {step === 'email' && 'Mot de passe oublié'}
                {step === 'code' && 'Vérification du code'}
                {step === 'password' && 'Nouveau mot de passe'}
              </h2>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {message.text}
                </div>
              )}

              {/* ÉTAPE 1: EMAIL */}
              {step === 'email' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <button
                    onClick={handleRequestCode}
                    disabled={loadingAction}
                    className="w-full py-3 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingAction ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      'Envoyer le code'
                    )}
                  </button>
                </>
              )}

              {/* ÉTAPE 2: CODE */}
              {step === 'code' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                      Code reçu par email
                    </label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full p-3 text-center text-2xl tracking-widest border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                      placeholder="00000000"
                      maxLength={8}
                    />
                  </div>

                  <button
                    onClick={handleVerifyCode}
                    disabled={loadingAction}
                    className="w-full py-3 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingAction ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      'Vérifier le code'
                    )}
                  </button>
                </>
              )}

              {/* ÉTAPE 3: NOUVEAU MOT DE PASSE */}
              {step === 'password' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={loadingAction}
                    className="w-full py-3 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingAction ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Réinitialisation...
                      </>
                    ) : (
                      'Réinitialiser le mot de passe'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};