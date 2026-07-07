import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 
        rounded-2xl border border-white/30 dark:border-gray-800/50 
        shadow-xl hover:shadow-2xl transition-all duration-500
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};