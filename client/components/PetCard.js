import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Displays a single pet in card form. Clicking on the card navigates to
 * the pet's detail page. Provides a placeholder image when no imageURL
 * is available.
 */
export default function PetCard({ pet }) {
  const {
    _id,
    id,
    name,
    breed,
    age,
    location,
    imageURL,
  } = pet;

  const defaultImage = 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <div className="pet-card">
      <Link to={`/pets/${_id || id}`}>
        <img src={imageURL || defaultImage} alt={name} />
        <div className="card-content">
          <h3>{name}</h3>
          <p>{breed || 'Unknown breed'}</p>
          <p>{age != null ? `${age} yrs` : 'Age unknown'}</p>
          <p>{location || 'Location unknown'}</p>
        </div>
      </Link>
    </div>
  );
}