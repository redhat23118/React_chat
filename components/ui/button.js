import React from 'react';

export const Button = ({ onClick, children, type = 'button', variant = 'primary', className = '', disabled = false }) => {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-700',
    outline: 'bg-transparent border border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
