import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PetCard from './PetCard';   // assume this renders an individual card
import { BiSearch, BiRefresh } from 'react-icons/bi';

export default function PetList() {
  const [pets, setPets]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [query, setQuery]       = useState('');

  const fetchPets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pets?search=${query}`);
      if (!res.ok) throw new Error('Failed to fetch pets');
      setPets(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []); // or [query] if you want live updates

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* ——— Search & Header Bar —— */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Available Pets
        </h1>

        <div className="flex w-full sm:w-auto space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by breed or location…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:border-brand focus:ring-brand transition"
            />
            <BiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
          <button
            onClick={fetchPets}
            className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-hover transition flex items-center"
          >
            <BiRefresh className="mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* ——— Error State —— */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchPets}
            className="underline hover:text-red-800 flex items-center"
          >
            Retry
          </button>
        </div>
      )}

      {/* ——— Loading Skeleton —— */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white rounded-lg h-64"
            />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <p className="text-center text-gray-500 mt-20">
          No pets found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map(pet => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
}