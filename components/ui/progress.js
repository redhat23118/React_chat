import React from 'react';

export const Progress = ({ value, className = '' }) => {
  return (
    <div className={`w-full bg-gray-200 rounded ${className}`}>
      <div
        className="bg-blue-500 text-xs leading-none py-1 text-center text-white rounded"
        style={{ width: `${value}%` }}
      >
        {value}%
      </div>
    </div>
  );
};
