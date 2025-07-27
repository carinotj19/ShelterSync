import React from 'react';

export default function AuthLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">{title}</h2>
        {children}
      </div>
    </div>
  );
}