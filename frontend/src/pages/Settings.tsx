import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { 
  Newspaper, User, Bell, Globe, Save, Mail, Users, Eye, EyeOff, 
  Trash2, UserPlus, Shield, XCircle, Loader2
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

  // Validation du formulaire
  const validateForm = () => {
    if (!newAdmin.name.trim()) {
      alert('Veuillez saisir un nom');
      return false;
    }
    if (!newAdmin.email.trim()) {
      alert('Veuillez saisir un email');
      return false;
    }
    if (!newAdmin.password) {
      alert('Veuillez saisir un mot de passe');
      return false;
    }
    if (newAdmin.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (newAdmin.password !== newAdmin.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return false;
    }
    setPasswordError('');
    return true;
  };

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
      await api.delete(`/auth/admins/${id}`);
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
      await api.delete(`/users/admins/${id}`);
      setAdmins(admins.filter(a => a._id !== id));
      alert('Administrateur supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Créer un nouvel administrateur
  const handleCreateAdmin = async () => {
    if (!validateForm()) return;
    
    setCreatingAdmin(true);
    try {
      const response = await api.post('/auth/register', {
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password,
        role: 'admin'
      });
      
      if (response.data.success) {
        alert(`Administrateur ${newAdmin.email} créé avec succès !`);
        setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' });
        setPasswordError('');
        fetchAdmins();
      }
    } catch (error: any) {
      console.error('Erreur création admin:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
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

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      alert('Paramètres sauvegardés !');
      setSaving(false);
    }, 1000);
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

          {/* SECTION ADMINISTRATEURS MODERNISÉE */}
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
                {/* Formulaire d'ajout modernisé */}
                <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#FF4500]">
                    <UserPlus size={20} /> Ajouter un administrateur
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
                      <input
                        type="text"
                        placeholder="Jean Dupont"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="admin@exemple.com"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer le mot de passe</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={newAdmin.confirmPassword}
                          onChange={(e) => {
                            setNewAdmin({ ...newAdmin, confirmPassword: e.target.value });
                            if (newAdmin.password !== e.target.value) {
                              setPasswordError('Les mots de passe ne correspondent pas');
                            } else {
                              setPasswordError('');
                            }
                          }}
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {passwordError && (
                    <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
                      <XCircle size={16} />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  
                  <button
                    onClick={handleCreateAdmin}
                    disabled={creatingAdmin}
                    className="mt-5 px-6 py-3 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                  >
                    {creatingAdmin ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Ajouter un administrateur
                      </>
                    )}
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
                      <div key={admin._id} className="grid grid-cols-12 gap-3 py-3 border-b border-gray-100 dark:border-gray-800 items-center hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="col-span-4 text-sm font-medium flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#FF4500]/10 flex items-center justify-center">
                            <span className="text-[#FF4500] font-bold text-xs">
                              {admin.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {admin.name}
                        </div>
                        <div className="col-span-4 text-sm text-gray-600 dark:text-gray-400">{admin.email}</div>
                        <div className="col-span-3 text-xs text-gray-500">
                          {new Date(admin.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="col-span-1">
                          <button
                            onClick={() => handleDeleteAdmin(admin._id, admin.email)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
            <button className="mt-3 text-sm text-[#FF4500] hover:underline flex items-center gap-1">
              Changer le mot de passe
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell size={20} /> Notifications
            </h2>
            <label className="flex items-center justify-between cursor-pointer py-2 hover:bg-gray-50 dark:hover:bg-gray-800/30 px-3 -mx-3 rounded-lg transition-colors">
              <span className="text-gray-700 dark:text-gray-300">Notifications par email</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF4500] rounded" />
            </label>
            <label className="flex items-center justify-between cursor-pointer py-2 hover:bg-gray-50 dark:hover:bg-gray-800/30 px-3 -mx-3 rounded-lg transition-colors">
              <span className="text-gray-700 dark:text-gray-300">Alerte nouvelle publication</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#FF4500] rounded" />
            </label>
          </div>

          {/* Préférences */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Globe size={20} /> Préférences
            </h2>
            <div className="mb-4">
              <label className="block mb-2 text-sm text-gray-700 dark:text-gray-300">Langue</label>
              <select className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent transition-all">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-700 dark:text-gray-300">Thème</label>
              <select className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#FF4500] focus:border-transparent transition-all">
                <option value="system">Système</option>
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
              </select>
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Sauvegarder les paramètres
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};