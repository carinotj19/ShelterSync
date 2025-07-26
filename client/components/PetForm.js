import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Form for shelters and admins to create new pet listings. File input
 * allows uploading an image which will be stored in GridFS on the
 * server. After successful creation the user is redirected to the pet
 * list.
 */
function PetForm({ token }) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const formData = new FormData();
    formData.append('name', name);
    if (breed) formData.append('breed', breed);
    if (age) formData.append('age', age);
    if (location) formData.append('location', location);
    if (healthNotes) formData.append('healthNotes', healthNotes);
    if (image) formData.append('image', image);
    try {
      const res = await fetch('/pets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create pet');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Failed to create pet');
    }
  };

  return (
    <div>
      <h2>Add a Pet</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px' }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <textarea
          placeholder="Health notes"
          value={healthNotes}
          onChange={(e) => setHealthNotes(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button type="submit">Save</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default PetForm;