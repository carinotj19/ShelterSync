import React, { useEffect, useState } from 'react';
import PetCard from './PetCard';

/**
 * Lists all pets and provides simple search/filter inputs. Results are
 * fetched from the server via the public /pets endpoint. Pets are
 * displayed in a responsive grid layout using PetCard components.
 */
export default function PetList() {
  const [pets, setPets] = useState([]);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  // Fetch pets from the API. Accepts an optional query string.
  const fetchPets = async (query = '') => {
    try {
      const res = await fetch(`/pets${query}`);
      const data = await res.json();
      if (res.ok) {
        setPets(data);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch pets');
      }
    } catch (err) {
      setError('Failed to fetch pets');
    }
  };

  // Load all pets on initial mount
  useEffect(() => {
    fetchPets('');
  }, []);

  // Handle search/filter form submission
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (breed) params.append('breed', breed);
    if (age) params.append('age', age);
    if (location) params.append('location', location);
    const queryString = params.toString();
    fetchPets(queryString ? `?${queryString}` : '');
  };

  return (
    <div>
      <h2>Available Pets</h2>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          value={breed}
          placeholder="Breed"
          onChange={(e) => setBreed(e.target.value)}
        />
        <input
          type="number"
          value={age}
          placeholder="Age"
          onChange={(e) => setAge(e.target.value)}
        />
        <input
          type="text"
          value={location}
          placeholder="Location"
          onChange={(e) => setLocation(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {error && <p className="message error">{error}</p>}
      <div className="pet-grid">
        {pets.map((pet) => (
          <PetCard key={pet._id || pet.id} pet={pet} />
        ))}
      </div>
    </div>
  );
}