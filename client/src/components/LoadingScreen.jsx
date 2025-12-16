import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-6">
      <div className="card-glass max-w-md w-full text-center">
        <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-800 shadow-lg shadow-primary-500/25 grid place-items-center">
          <div className="h-7 w-7 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
        </div>
        <h2 className="text-xl font-semibold title-gradient">Chargement…</h2>
        <p className="mt-2 text-sm text-gray-600">Préparation d’une expérience fluide et rapide.</p>
      </div>
    </div>
  );
}


