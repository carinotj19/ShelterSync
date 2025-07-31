import React from 'react';

export default function AuthLayout({ title, illustration, children }) {
  return (
    <div className="min-h-screen flex bg-waves bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Illustration column (hidden on small) */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="max-w-sm">
          <img src={illustration} alt="Happy pets" />
          <h2 className="mt-8 text-3xl font-bold text-gray-700">
            Find your new best friend
          </h2>
        </div>
      </div>

      {/* Form column */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10">
          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}