import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Newspaper, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  XCircle,
  Clock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [articlesPublishedOpen, setArticlesPublishedOpen] = useState(false);
  const [articlesRejectedOpen, setArticlesRejectedOpen] = useState(false);
  const [articlesPendingOpen, setArticlesPendingOpen] = useState(false);

  // Catégories pour ARTICLES PUBLIÉS
const publishedCategories = [
  { label: 'TOUS', path: '/admin/articles/published/all', param: 'all' },
  { label: 'POLITIQUE', path: '/admin/articles/published/politique', param: 'politique' },
  { label: 'SANTÉ', path: '/admin/articles/published/sante', param: 'sante' },
  { label: 'TECH', path: '/admin/articles/published/tech', param: 'tech' },
  { label: 'ÉCONOMIE', path: '/admin/articles/published/economie', param: 'economie' },
  { label: 'CULTURE', path: '/admin/articles/published/culture', param: 'culture' },
  { label: 'SPORTS', path: '/admin/articles/published/sports', param: 'sports' },
];

// Catégories pour ARTICLES EN ATTENTE
const pendingCategories = [
  { label: 'TOUS', path: '/admin/articles/pending/all', param: 'all' },
  { label: 'POLITIQUE', path: '/admin/articles/pending/politique', param: 'politique' },
  { label: 'SANTÉ', path: '/admin/articles/pending/sante', param: 'sante' },
  { label: 'TECH', path: '/admin/articles/pending/tech', param: 'tech' },
  { label: 'ÉCONOMIE', path: '/admin/articles/pending/economie', param: 'economie' },
  { label: 'CULTURE', path: '/admin/articles/pending/culture', param: 'culture' },
  { label: 'SPORTS', path: '/admin/articles/pending/sports', param: 'sports' },
];

// Catégories pour ARTICLES REJETÉS
const rejectedCategories = [
  { label: 'TOUS', path: '/admin/articles/rejected/all', param: 'all' },
  { label: 'POLITIQUE', path: '/admin/articles/rejected/politique', param: 'politique' },
  { label: 'SANTÉ', path: '/admin/articles/rejected/sante', param: 'sante' },
  { label: 'TECH', path: '/admin/articles/rejected/tech', param: 'tech' },
  { label: 'ÉCONOMIE', path: '/admin/articles/rejected/economie', param: 'economie' },
  { label: 'CULTURE', path: '/admin/articles/rejected/culture', param: 'culture' },
  { label: 'SPORTS', path: '/admin/articles/rejected/sports', param: 'sports' },
];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Composant réutilisable pour un menu déroulant
  const DropdownMenuItem = ({ 
    icon: Icon, 
    label, 
    isOpen, 
    setIsOpen, 
    items,
    shortLabel 
  }: { 
    icon: React.ElementType, 
    label: string, 
    isOpen: boolean, 
    setIsOpen: (value: boolean) => void, 
    items: { label: string; path: string; param: string }[],
    shortLabel: string
  }) => (
    <div>
      <div
        onClick={() => !collapsed && setIsOpen(!isOpen)}
        className={`
          group relative flex items-center gap-4 py-4 mx-4 my-1 cursor-pointer
          transition-all duration-200 border-l-4 border-transparent
          text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:border-gray-300
          ${collapsed ? 'justify-center px-0' : 'px-6'}
        `}
      >
        <Icon className="w-5 h-5" />
        {!collapsed && (
          <>
            <span className="text-[11px] font-black uppercase tracking-wider flex-1">{label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            {shortLabel}
          </div>
        )}
      </div>

      {!collapsed && isOpen && (
        <div className="ml-12 space-y-1 mb-2">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <div
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center gap-3 py-2 px-4 cursor-pointer rounded-lg
                  transition-all duration-200
                  ${active 
                    ? 'text-[#FF4500] bg-gray-50 dark:bg-gray-800/50 font-bold' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                  }
                `}
              >
                <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 relative">
      <div className="h-6" />

      <nav className="flex-1 py-4 overflow-y-auto">
        
        {/* TABLEAU DE BORD */}
        <div
          onClick={() => handleNavigation('/admin')}
          className={`
            group relative flex items-center gap-4 py-4 mx-4 my-1 cursor-pointer
            transition-all duration-200 border-l-4
            ${isActive('/admin') 
              ? 'border-[#FF4500] bg-gray-50 dark:bg-gray-800/50 text-[#FF4500]' 
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:border-gray-300'
            }
            ${collapsed ? 'justify-center px-0' : 'px-6'}
          `}
        >
          <LayoutDashboard className={`w-5 h-5 ${isActive('/admin') ? 'text-[#FF4500]' : ''}`} />
          {!collapsed && (
            <span className={`text-[11px] font-black uppercase tracking-wider ${isActive('/admin') ? 'text-[#FF4500]' : ''}`}>
              TABLEAU DE BORD
            </span>
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              BORD
            </div>
          )}
        </div>

        {/* ARTICLES PUBLIÉS */}
        <DropdownMenuItem
          icon={Newspaper}
          label="ARTICLES PUBLIÉS"
          shortLabel="PUB"
          isOpen={articlesPublishedOpen}
          setIsOpen={setArticlesPublishedOpen}
          items={publishedCategories}
        />

        {/* ARTICLES REJETÉS */}
        <DropdownMenuItem
          icon={XCircle}
          label="ARTICLES REJETÉS"
          shortLabel="REJ"
          isOpen={articlesRejectedOpen}
          setIsOpen={setArticlesRejectedOpen}
          items={rejectedCategories}
        />

        {/* ARTICLES EN ATTENTE */}
        <DropdownMenuItem
          icon={Clock}
          label="ARTICLES EN ATTENTE"
          shortLabel="ATT"
          isOpen={articlesPendingOpen}
          setIsOpen={setArticlesPendingOpen}
          items={pendingCategories}
        />

        {/* STATISTIQUES */}
        <div
          onClick={() => handleNavigation('/admin/stats')}
          className={`
            group relative flex items-center gap-4 py-4 mx-4 my-1 cursor-pointer
            transition-all duration-200 border-l-4
            ${isActive('/admin/stats') 
              ? 'border-[#FF4500] bg-gray-50 dark:bg-gray-800/50 text-[#FF4500]' 
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:border-gray-300'
            }
            ${collapsed ? 'justify-center px-0' : 'px-6'}
          `}
        >
          <TrendingUp className={`w-5 h-5 ${isActive('/admin/stats') ? 'text-[#FF4500]' : ''}`} />
          {!collapsed && (
            <span className={`text-[11px] font-black uppercase tracking-wider ${isActive('/admin/stats') ? 'text-[#FF4500]' : ''}`}>
              STATISTIQUES
            </span>
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              STATS
            </div>
          )}
        </div>

        {/* PARAMÈTRES */}
        <div
          onClick={() => handleNavigation('/admin/settings')}
          className={`
            group relative flex items-center gap-4 py-4 mx-4 my-1 cursor-pointer
            transition-all duration-200 border-l-4
            ${isActive('/admin/settings') 
              ? 'border-[#FF4500] bg-gray-50 dark:bg-gray-800/50 text-[#FF4500]' 
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:border-gray-300'
            }
            ${collapsed ? 'justify-center px-0' : 'px-6'}
          `}
        >
          <Settings className={`w-5 h-5 ${isActive('/admin/settings') ? 'text-[#FF4500]' : ''}`} />
          {!collapsed && (
            <span className={`text-[11px] font-black uppercase tracking-wider ${isActive('/admin/settings') ? 'text-[#FF4500]' : ''}`}>
              PARAMÈTRES
            </span>
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              PARAMS
            </div>
          )}
        </div>

        {/* DÉCONNEXION */}
        <div className="mt-6">
          <div
            onClick={handleLogout}
            className={`
              group relative flex items-center gap-4 py-4 mx-4 my-1 cursor-pointer
              transition-all duration-200 border-l-4 border-transparent
              text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500
              ${collapsed ? 'justify-center px-0' : 'px-6'}
            `}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && (
              <span className="text-[11px] font-black uppercase tracking-wider">DÉCONNEXION</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                DECO
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 flex items-center justify-center shadow-md hover:shadow-lg transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-black dark:text-white" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-black dark:text-white" />
          )}
        </button>
      )}
    </div>
  );
};