import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Newspaper, LogOut, BarChart3, Users, Mail, Trash2, Eye } from 'lucide-react';

interface Subscriber {
  _id: string;
  email: string;
  subscribedAt: string;
  status: string;
}

export const Stats: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [showSubscribers, setShowSubscribers] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Récupérer les statistiques des articles
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/articles/stats');
        setStats(response.data.data);
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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

  // Ouvrir/fermer la liste des abonnés
  const handleShowSubscribers = () => {
    setShowSubscribers(!showSubscribers);
    if (!showSubscribers) {
      fetchSubscribers();
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
                📊 Statistiques
              </h1>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-4 py-4 border-2 border-black dark:border-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-300"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4500]"></div>
          </div>
        ) : (
          <>
            {/* Cartes statistiques articles */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-blue-600">{stats?.total || 0}</div>
                <div className="text-gray-500 mt-1">Total articles</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-orange-500">{stats?.byStatus?.pending || 0}</div>
                <div className="text-gray-500 mt-1">En attente</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-green-600">{stats?.byStatus?.published || 0}</div>
                <div className="text-gray-500 mt-1">Publiés</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                <div className="text-3xl font-bold text-red-600">{stats?.byStatus?.rejected || 0}</div>
                <div className="text-gray-500 mt-1">Rejetés</div>
              </div>
            </div>

            {/* SECTION ABONNÉS - NOUVEAU */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4500]"></div>
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

            {/* Sources */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={20} /> Sources
              </h2>
              {stats?.bySource && Object.entries(stats.bySource).map(([source, count]) => (
                <div key={source} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">{source}</span>
                  <span className="font-bold text-[#FF4500]">{count as number}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-gray-500">
              Dernier scraping: {stats?.lastScraped ? new Date(stats.lastScraped).toLocaleString('fr-FR') : 'Jamais'}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};