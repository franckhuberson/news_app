import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-800/50">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Search bar */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20">
            <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              className="bg-transparent border-none outline-none text-sm w-64 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-white/20 rounded-xl transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
          </button>
          
          <button className="flex items-center gap-2 p-2 hover:bg-white/20 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden md:block font-medium">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};