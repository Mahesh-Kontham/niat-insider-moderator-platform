import React from 'react';

const Badge = ({ children, variant = 'gray', className = '' }) => {
  const styles = {
    gray: 'bg-slate-100 text-slate-700 border border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    red: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
