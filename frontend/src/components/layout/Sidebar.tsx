import React from 'react';
import { LayoutDashboard, Newspaper, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Newspaper, label: 'Articles' },
    { icon: Settings, label: 'Paramètres' },
  ];

  return (
    <nav className="mt-8">
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`
              flex items-center gap-4 px-6 py-4 mx-2 my-1 rounded-xl
              transition-all duration-300 cursor-pointer
              ${item.active 
                ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/10 text-primary-700 dark:text-primary-400 border-l-4 border-primary-500' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </div>
        );
      })}
      
      {/* Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-400/20 to-transparent my-4" />
      
      {/* Logout */}
      <div className="flex items-center gap-4 px-6 py-4 mx-2 my-1 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all duration-300">
        <LogOut className="w-5 h-5" />
        {!collapsed && <span className="font-medium">Déconnexion</span>}
      </div>
    </nav>
  );
};