import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Newspaper, LogOut, Users, Mail, Trash2, Eye, Activity, TrendingUp, MousePointer } from 'lucide-react';

interface Subscriber {
  _id: string;
  email: string;
  subscribedAt: string;
  // ✅ status supprimé
}

interface DailyVisitorData {
  date: string;
  formattedDate: string;
  visits: number;
  uniqueVisitors: number;
  pageViews: number;
}

interface VisitorStats {
  summary: {
    totalVisits: number;
    totalUniqueVisitors: number;
    totalPageViews: number;
    avgVisitsPerDay: number;
    avgPageViewsPerDay: number;
    period: string;
  };
  daily: DailyVisitorData[];
  topPages: { page: string; views: number }[];
}

export const Stats: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [showSubscribers, setShowSubscribers] = useState(false);
  
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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

  useEffect(() => {
    fetchVisitorStats();
  }, [period]);

  const fetchVisitorStats = async () => {
    setLoadingVisitors(true);
    try {
      const response = await api.get(`/visitors/stats?period=${period}`);
      if (response.data.success) {
        setVisitorStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats visiteurs:', error);
    } finally {
      setLoadingVisitors(false);
    }
  };

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

  const handleShowSubscribers = () => {
    setShowSubscribers(!showSubscribers);
    if (!showSubscribers) {
      fetchSubscribers();
    }
  };

  const totalVisits = visitorStats?.summary?.totalVisits ?? 0;
  const totalPageViews = visitorStats?.summary?.totalPageViews ?? 0;
  const avgVisitsPerDay = visitorStats?.summary?.avgVisitsPerDay ?? 0;
  const totalUniqueVisitors = visitorStats?.summary?.totalUniqueVisitors ?? 0;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* HEADER */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-black dark:border-white">
            <div>
              <div className="flex items-center gap-2 mb-2 text-primary-500 font-black uppercase tracking-[0.3em] text-[10px]">
                <Newspaper size={14} /> Système de Rédaction
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter dark:text-white italic">
                Statistiques
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-4 py-4 border-2 border-black dark:border-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-300"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {/* ===== STATISTIQUES VISITEURS ===== */}
            <div className="mb-8">
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Activity size={24} className="text-primary-500" />
                  Fréquentation du site
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setPeriod('7d')}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                      period === '7d' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    7 jours
                  </button>
                  <button
                    onClick={() => setPeriod('30d')}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                      period === '30d' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    30 jours
                  </button>
                  <button
                    onClick={() => setPeriod('90d')}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                      period === '90d' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    90 jours
                  </button>
                </div>
              </div>
              
              {loadingVisitors ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : visitorStats ? (
                <>
                  {/* CARTES STATISTIQUES */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-primary-500">{totalVisits}</div>
                        <div className="p-2 bg-primary-500/10 rounded-lg">
                          <MousePointer size={20} className="text-primary-500" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Visites totales</div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-blue-500">{totalUniqueVisitors}</div>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Users size={20} className="text-blue-500" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Visiteurs uniques</div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-green-500">{Math.round(avgVisitsPerDay)}</div>
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <TrendingUp size={20} className="text-green-500" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Visites par jour</div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-purple-500">{totalPageViews}</div>
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Eye size={20} className="text-purple-500" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Pages vues</div>
                    </div>
                  </div>

                  {/* ✅ SECTION ABONNÉS - SANS COLONNE STATUT */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
                    <div onClick={handleShowSubscribers} className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/10 rounded-lg">
                          <Users size={24} className="text-primary-500" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">Abonnés à la newsletter</h2>
                          <p className="text-sm text-gray-500">
                            {subscribers.length > 0 ? `${subscribers.length} abonnés` : 'Aucun abonné'}
                          </p>
                        </div>
                      </div>
                      <Eye size={20} className={`text-primary-500 transition-transform ${showSubscribers ? 'rotate-180' : ''}`} />
                    </div>

                    {showSubscribers && (
                      <div className="border-t border-gray-200 dark:border-gray-800 p-6">
                        {loadingSubscribers ? (
                          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
                        ) : subscribers.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Mail size={40} className="mx-auto mb-3 text-gray-300" />
                            <p>Aucun abonné</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-12 gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase">
                              <div className="col-span-7">Email</div>
                              <div className="col-span-4">Date d'abonnement</div>
                              <div className="col-span-1">Action</div>
                            </div>
                            {subscribers.map((sub) => (
                              <div key={sub._id} className="grid grid-cols-12 gap-3 py-3 border-b border-gray-100 dark:border-gray-800 items-center">
                                <div className="col-span-7 text-sm truncate font-medium text-gray-700 dark:text-gray-300">{sub.email}</div>
                                <div className="col-span-4 text-xs text-gray-500">{new Date(sub.subscribedAt).toLocaleDateString('fr-FR')}</div>
                                <div className="col-span-1">
                                  <button onClick={() => handleDeleteSubscriber(sub._id)} className="text-red-500 hover:text-red-700 transition-colors">
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

                  {/* ARTICLES STATS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                      <div className="text-3xl font-bold text-primary-500">{stats?.total || 0}</div>
                      <div className="text-sm text-gray-500 mt-1">Total articles</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                      <div className="text-3xl font-bold text-orange-500">{stats?.byStatus?.pending || 0}</div>
                      <div className="text-sm text-gray-500 mt-1">En attente</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800">
                      <div className="text-3xl font-bold text-green-500">{stats?.byStatus?.published || 0}</div>
                      <div className="text-sm text-gray-500 mt-1">Publiés</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400">
                    Dernier scraping: {stats?.lastScraped ? new Date(stats.lastScraped).toLocaleString('fr-FR') : 'Jamais'}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Aucune statistique de fréquentation disponible.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};