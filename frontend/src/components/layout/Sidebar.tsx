import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Newspaper, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag,
  ChevronDown,
  /*CheckCircle,*/
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
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'TABLEAU DE BORD', path: '/admin', shortLabel: 'BORD' },
    { icon: Newspaper, label: 'ARTICLES PUBLIÉS', path: '/admin/articles/published', shortLabel: 'PUB' },
    { icon: XCircle, label: 'ARTICLES REJETÉS', path: '/admin/articles/rejected', shortLabel: 'REJ' },
    { icon: Clock, label: 'EN ATTENTE', path: '/admin/articles/pending', shortLabel: 'ATT' },
    { icon: TrendingUp, label: 'STATISTIQUES', path: '/admin/stats', shortLabel: 'STATS' },
  ];

  const categories = [
    { label: 'POLITIQUE', path: '/admin/categories/politique' },
    { label: 'SANTÉ', path: '/admin/categories/sante' },
    { label: 'TECH', path: '/admin/categories/tech' },
    { label: 'ÉCONOMIE', path: '/admin/categories/economie' },
    { label: 'CULTURE', path: '/admin/categories/culture' },
    { label: 'SPORTS', path: '/admin/categories/sports' },
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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 relative">
      {/* Espace en haut */}
      <div className="h-6" />

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <div
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`
                group relative flex items-center gap-4 py-4 mx-4 my-1 cursor-pointer
                transition-all duration-200 border-l-4
                ${active 
                  ? 'border-[#FF4500] bg-gray-50 dark:bg-gray-800/50 text-[#FF4500]' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:border-gray-300'
                }
                ${collapsed ? 'justify-center px-0' : 'px-6'}
              `}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-[#FF4500]' : ''}`} />
              {!collapsed && (
                <span className={`text-[11px] font-black uppercase tracking-wider ${active ? 'text-[#FF4500]' : ''}`}>
                  {item.label}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {item.shortLabel}
                </div>
              )}
            </div>
          );
        })}

        {/* CATÉGORIES avec menu déroulant */}
        <div>
          <div
            onClick={() => !collapsed && setCategoriesOpen(!categoriesOpen)}
            className={`
              group relative flex items-center gap-4 py-4 mx-4 my-1 cursor-pointer
              transition-all duration-200 border-l-4 border-transparent
              text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:border-gray-300
              ${collapsed ? 'justify-center px-0' : 'px-6'}
            `}
          >
            <Tag className="w-5 h-5" />
            {!collapsed && (
              <>
                <span className="text-[11px] font-black uppercase tracking-wider flex-1">CATÉGORIES</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} />
              </>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                CAT
              </div>
            )}
          </div>

          {/* Sous-menu des catégories */}
          {!collapsed && categoriesOpen && (
            <div className="ml-12 space-y-1 mb-2">
              {categories.map((cat) => {
                const active = isActive(cat.path);
                return (
                  <div
                    key={cat.path}
                    onClick={() => handleNavigation(cat.path)}
                    className={`
                      flex items-center gap-3 py-2 px-4 cursor-pointer rounded-lg
                      transition-all duration-200
                      ${active 
                        ? 'text-[#FF4500] bg-gray-50 dark:bg-gray-800/50 font-bold' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }
                    `}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider">{cat.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-4" />
        
        {/* PARAMÈTRES */}
        {(() => {
          const SettingsIcon = Settings;
          const active = isActive('/admin/settings');
          return (
            <div
              onClick={() => handleNavigation('/admin/settings')}
              className={`
                group relative flex items-center gap-4 py-4 mx-4 my-1 cursor-pointer
                transition-all duration-200 border-l-4
                ${active 
                  ? 'border-[#FF4500] bg-gray-50 dark:bg-gray-800/50 text-[#FF4500]' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:border-gray-300'
                }
                ${collapsed ? 'justify-center px-0' : 'px-6'}
              `}
            >
              <SettingsIcon className={`w-5 h-5 ${active ? 'text-[#FF4500]' : ''}`} />
              {!collapsed && (
                <span className={`text-[11px] font-black uppercase tracking-wider ${active ? 'text-[#FF4500]' : ''}`}>
                  PARAMÈTRES
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  PARAMS
                </div>
              )}
            </div>
          );
        })()}

        {/* DÉCONNEXION - placée APRÈS les paramètres */}
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
      
      {/* Bouton toggle (optionnel) */}
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