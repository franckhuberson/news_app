import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { 
  Newspaper, User, Bell, Globe, Mail, Users, Eye, EyeOff, 
  Trash2, UserPlus, Shield, Lock, KeyRound, X, Loader2
} from 'lucide-react';
import { api } from '../services/api';

interface Subscriber {
  _id: string;
  email: string;
  subscribedAt: string;
  status: string;
}

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const Settings: React.FC = () => {
  const [saving, setSaving] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [showSubscribers, setShowSubscribers] = useState(false);
  
  // États pour les administrateurs
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAdmins, setShowAdmins] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // États pour la vérification du code admin
  const [showAdminCodeModal, setShowAdminCodeModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [pendingAdminData, setPendingAdminData] = useState<{ name: string; email: string; password: string } | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // États pour le changement de mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Récupérer la liste des abonnés
  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const response = await api.get('/subscribers/subscribers');
      setSubscribers(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement abonnés:', error);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // Récupérer la liste des administrateurs
  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await api.get('/auth/admins');
      setAdmins(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Supprimer un abonné
  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) return;
    try {
      await api.delete(`/subscribers/subscribers/${id}`);
      setSubscribers(subscribers.filter(s => s._id !== id));
      alert('Abonné supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Supprimer un administrateur
  const handleDeleteAdmin = async (id: string, email: string) => {
    if (email === 'admin@test.com') {
      alert('Vous ne pouvez pas supprimer l\'administrateur principal');
      return;
    }
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur ${email} ?`)) return;
    try {
      await api.delete(`/auth/admins/${id}`);
      setAdmins(admins.filter(a => a._id !== id));
      alert('Administrateur supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Demander un code par email avant de créer l'admin
  const handleRequestAdminCode = async () => {
    console.log('🟢 handleRequestAdminCode appelée');
    
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    if (newAdmin.password !== newAdmin.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newAdmin.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSendingCode(true);
    setCodeMessage(null);

    try {
      console.log('📡 Envoi de la requête à /auth/request-admin-code');
      const response = await api.post('/auth/request-admin-code', {
        email: newAdmin.email
      });
      
      console.log('📦 Réponse reçue:', response.data);

      if (response.data.success) {
        setPendingAdminData({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password
        });
        setShowAdminCodeModal(true);
        setCodeMessage({ text: 'Code envoyé à ' + newAdmin.email, type: 'success' });
      } else {
        setCodeMessage({ text: response.data.message, type: 'error' });
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setCodeMessage({ text: error.response?.data?.message || 'Erreur', type: 'error' });
    } finally {
      setSendingCode(false);
    }
  };

  // Vérifier le code et créer l'admin
  const handleVerifyAdminCode = async () => {
    if (!adminCode) {
      setCodeMessage({ text: 'Veuillez entrer le code reçu', type: 'error' });
      return;
    }

    setCreatingAdmin(true);
    setCodeMessage(null);

    try {
      const response = await api.post('/auth/verify-admin-code', {
        email: pendingAdminData?.email,
        code: adminCode,
        name: pendingAdminData?.name,
        password: pendingAdminData?.password
      });

      if (response.data.success) {
        setCodeMessage({ text: response.data.message, type: 'success' });
        setTimeout(() => {
          setShowAdminCodeModal(false);
          setAdminCode('');
          setPendingAdminData(null);
          setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' });
          fetchAdmins();
          setCodeMessage(null);
        }, 2000);
      } else {
        setCodeMessage({ text: response.data.message, type: 'error' });
      }
    } catch (error: any) {
      setCodeMessage({ text: error.response?.data?.message || 'Erreur', type: 'error' });
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Ouvrir/fermer la liste des abonnés
  const handleShowSubscribers = () => {
    setShowSubscribers(!showSubscribers);
    if (!showSubscribers) {
      fetchSubscribers();
    }
  };

  // Ouvrir/fermer la liste des administrateurs
  const handleShowAdmins = () => {
    setShowAdmins(!showAdmins);
    if (!showAdmins) {
      fetchAdmins();
    }
  };

  // Fonction pour changer le mot de passe
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage({ text: 'Veuillez remplir tous les champs', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Le mot de passe doit contenir au moins 6 caractères', type: 'error' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ text: 'Les nouveaux mots de passe ne correspondent pas', type: 'error' });
      return;
    }

    setChangingPassword(true);
    setPasswordMessage(null);

    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        setPasswordMessage({ text: 'Mot de passe changé avec succès !', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordMessage(null);
        }, 2000);
      }
    } catch (error: any) {
      setPasswordMessage({
        text: error.response?.data?.message || 'Erreur lors du changement de mot de passe',
        type: 'error'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* HEADER */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-black dark:border-white">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#FF4500] font-black uppercase tracking-[0.3em] text-[10px]">
                <Newspaper size={14} /> Système de Rédaction
              </div>
              <h1 className="text-5xl font-black uppercase tracking-tighter dark:text-white italic">
                ⚙️ Paramètres
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* SECTION ABONNÉS */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div 
              onClick={handleShowSubscribers}
              className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF4500]/10 rounded-lg">
                  <Users size={24} className="text-[#FF4500]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Abonnés à la newsletter</h2>
                  <p className="text-sm text-gray-500">
                    {subscribers.length > 0 ? `${subscribers.length} abonnés` : 'Aucun abonné pour le moment'}
                  </p>
                </div>
              </div>
              <div className="text-[#FF4500]">
                <Eye size={20} className={showSubscribers ? 'rotate-180' : ''} />
              </div>
            </div>

            {showSubscribers && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-6">
                {loadingSubscribers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-[#FF4500]" />
                  </div>
                ) : subscribers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Mail size={40} className="mx-auto mb-3 text-gray-300" />
                    <p>Aucun abonné pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                      <div className="col-span-6">Email</div>
                      <div className="col-span-3">Date d'abonnement</div>
                      <div className="col-span-2">Statut</div>
                      <div className="col-span-1">Action</div>
                    </div>
                    {subscribers.map((sub) => (
                      <div key={sub._id} className="grid grid-cols-12 gap-3 py-3 border-b border-gray-100 dark:border-gray-800 items-center">
                        <div className="col-span-6 text-sm truncate">{sub.email}</div>
                        <div className="col-span-3 text-xs text-gray-500">
                          {new Date(sub.subscribedAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="col-span-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            sub.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {sub.status === 'active' ? 'Actif' : 'Désabonné'}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <button
                            onClick={() => handleDeleteSubscriber(sub._id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION ADMINISTRATEURS */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div 
              onClick={handleShowAdmins}
              className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF4500]/10 rounded-lg">
                  <Shield size={24} className="text-[#FF4500]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Administrateurs</h2>
                  <p className="text-sm text-gray-500">
                    {admins.length > 0 ? `${admins.length} administrateur${admins.length > 1 ? 's' : ''}` : 'Aucun administrateur'}
                  </p>
                </div>
              </div>
              <div className="text-[#FF4500]">
                <Eye size={20} className={showAdmins ? 'rotate-180' : ''} />
              </div>
            </div>

            {showAdmins && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-6">
                {/* Formulaire d'ajout */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <UserPlus size={18} /> Ajouter un administrateur
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nom complet"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                      className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    />
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de passe"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmer"
                        value={newAdmin.confirmPassword}
                        onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                        className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {passwordError && (
                    <p className="text-red-500 text-xs mt-2">{passwordError}</p>
                  )}
                  <button
                    onClick={handleRequestAdminCode}
                    disabled={sendingCode}
                    className="mt-3 px-4 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all disabled:opacity-50 text-sm"
                  >
                    {sendingCode ? 'Envoi du code...' : 'Ajouter un administrateur'}
                  </button>
                </div>

                {/* Liste des administrateurs */}
                {loadingAdmins ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={32} className="animate-spin text-[#FF4500]" />
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield size={40} className="mx-auto mb-3 text-gray-300" />
                    <p>Aucun administrateur</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                      <div className="col-span-4">Nom</div>
                      <div className="col-span-4">Email</div>
                      <div className="col-span-3">Date de création</div>
                      <div className="col-span-1">Action</div>
                    </div>
                    {admins.map((admin) => (
                      <div key={admin._id} className="grid grid-cols-12 gap-3 py-3 border-b border-gray-100 dark:border-gray-800 items-center">
                        <div className="col-span-4 text-sm font-medium">{admin.name}</div>
                        <div className="col-span-4 text-sm text-gray-600 dark:text-gray-400">{admin.email}</div>
                        <div className="col-span-3 text-xs text-gray-500">
                          {new Date(admin.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="col-span-1">
                          <button
                            onClick={() => handleDeleteAdmin(admin._id, admin.email)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profil administrateur actuel */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User size={20} /> Votre profil
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Email: admin@test.com</p>
            <p className="text-gray-600 dark:text-gray-400">Rôle: Administrateur principal</p>
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="mt-3 text-sm text-[#FF4500] hover:underline flex items-center gap-1"
            >
              <Lock size={14} />
              Changer le mot de passe
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell size={20} /> Notifications
            </h2>
            <label className="flex items-center justify-between cursor-pointer py-2">
              <span className="text-gray-700 dark:text-gray-300">Notifications par email</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF4500]" />
            </label>
            <label className="flex items-center justify-between cursor-pointer py-2">
              <span className="text-gray-700 dark:text-gray-300">Alerte nouvelle publication</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF4500]" />
            </label>
          </div>

          {/* Préférences */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Globe size={20} /> Préférences
            </h2>
            <div className="mb-3">
              <label className="block mb-1 text-gray-700 dark:text-gray-300">Langue</label>
              <select className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">Thème</label>
              <select className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                <option value="system">Système</option>
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
              </select>
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSaving(true);
                setTimeout(() => {
                  alert('Paramètres sauvegardés !');
                  setSaving(false);
                }, 1000);
              }}
              disabled={saving}
              className="px-6 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CHANGER MOT DE PASSE */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full overflow-hidden">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <KeyRound size={20} className="text-[#FF4500]" />
                Changer le mot de passe
              </h2>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              {/* Mot de passe actuel */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Nouveau mot de passe */}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-2 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Modification...
                    </>
                  ) : (
                    'Modifier'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VÉRIFICATION CODE ADMIN */}
      {showAdminCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full overflow-hidden">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <KeyRound size={20} className="text-[#FF4500]" />
                Vérification du code
              </h2>
              <button 
                onClick={() => setShowAdminCodeModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {codeMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  codeMessage.type === 'success' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {codeMessage.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                  Code reçu par email
                </label>
                <input
                  type="text"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full p-3 text-center text-2xl tracking-widest border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent"
                  placeholder="00000000"
                  maxLength={8}
                />
              </div>

              <p className="text-xs text-gray-500 text-center">
                Un code à 8 chiffres a été envoyé à <strong>{pendingAdminData?.email}</strong>
              </p>

              <button
                onClick={handleVerifyAdminCode}
                disabled={creatingAdmin}
                className="w-full py-3 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingAdmin ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Vérifier et créer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};