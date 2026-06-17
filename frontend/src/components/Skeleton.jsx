import React from 'react';

const Skeleton = ({ className = '', variant = 'text' }) => {
  const baseStyle = 'animate-pulse bg-slate-100 rounded-lg';
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    rect: 'h-40 w-full',
  };

  return <div className={`${baseStyle} ${variants[variant]} ${className}`} />;
};

export default Skeleton;
