import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Lists all pets and provides a simple search/filter form. Results are
 * pulled from the server via the public /pets endpoint. Clicking a pet
 * navigates to its detail page.
 */
function PetList() {
  const [pets, setPets] = useState([]);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');

  // Fetch pets from the API. Accepts an optional query string.
  const fetchPets = async (query = '') => {
    const res = await fetch(`/pets${query}`);
    const data = await res.json();
    setPets(data);
  };

  useEffect(() => {
    fetchPets('');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (breed) params.append('breed', breed);
    if (age) params.append('age', age);
    if (location) params.append('location', location);
    fetchPets(`?${params.toString()}`);
  };

  return (
    <div>
      <h2>Available Pets</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
        />
        <input
          placeholder="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pets.map((pet) => (
          <li key={pet._id} style={{ marginBottom: '0.5rem' }}>
            <Link to={`/pets/${pet._id}`}>
              {pet.name} {pet.breed ? `- ${pet.breed}` : ''} {pet.age ? `(${pet.age} yrs)` : ''}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PetList;