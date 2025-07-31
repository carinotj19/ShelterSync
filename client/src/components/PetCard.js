import React from 'react';
import { Link } from 'react-router-dom';

export default function PetCard({ pet }) {
  return (
    <Link
      to={`/pets/${pet.id}`}
      className="bg-white rounded-xl shadow hover:shadow-lg transform hover:-translate-y-1 transition p-4 flex flex-col"
    >
      <div className="h-40 w-full bg-gray-100 rounded-md overflow-hidden mb-4">
        <img
          src={pet.imageUrl || '/placeholder.png'}
          alt={pet.breed}
          className="h-full w-full object-cover"
        />
      </div>
      <h3 className="text-lg font-medium text-gray-800">{pet.breed}</h3>
      <p className="text-gray-500">{pet.age} years old</p>
      <p className="text-gray-500 mb-4">{pet.location}</p>
      <span className="mt-auto inline-block bg-brand text-white text-center px-3 py-1 rounded-lg">
        View Details
      </span>
    </Link>
  );
}