import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full transition-all duration-500 ease-out
        ${sidebarOpen ? 'w-72' : 'w-20'}
        backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 
        border-r border-white/20 dark:border-gray-800/50
        shadow-2xl shadow-primary-500/5
      `}>
        <div className="p-6">
          <h1 className={`
            font-bold text-2xl bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent
            transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 scale-0'}
          `}>
            NewsPulse
          </h1>
        </div>
        <Sidebar collapsed={!sidebarOpen} />
      </aside>

      {/* Main content */}
      <main className={`transition-all duration-500 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="p-8">
          {/* Effet de verre sur le contenu */}
          <div className="relative">
            {/* Cercles décoratifs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />
            
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};