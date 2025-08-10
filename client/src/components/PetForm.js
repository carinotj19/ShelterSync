import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { petsAPI } from '../utils/api';

/**
 * Form for shelters to create new pet listings. File input allows
 * uploading an image which will be stored in GridFS on the server.
 * After successful creation the user is redirected to the pet list.
 */
export default function PetForm() {
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
      await petsAPI.createPet(formData);
      toast.success('Pet added successfully');
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create pet';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Add a Pet</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Name"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Breed
          </label>
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="input"
            placeholder="Breed"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Age
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="input"
            placeholder="Age"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
            placeholder="Location"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Health Notes
          </label>
          <textarea
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            className="input h-24 resize-none"
            placeholder="Health Notes"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="input"
          />
        </div>

        {error && (
          <p className="text-error text-sm">{error}</p>
        )}

        <button type="submit" className="btn-primary">
          Save
        </button>
      </form>
      {error && <p className="message error">{error}</p>}
    </div>
  );
}