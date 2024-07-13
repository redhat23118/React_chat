import React from 'react';

export const Input = ({ type = 'text', value, onChange, placeholder = '', className = '' }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`px-4 py-2 border border-gray-300 rounded ${className}`}
    />
  );
};