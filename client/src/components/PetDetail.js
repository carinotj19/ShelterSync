import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { petsAPI, adoptionAPI } from '../utils/api';

/**
 * Shows detailed information for a single pet. Adopters can submit an
 * adoption request by filling a message and clicking the button. The
 * request is sent via the authenticated /adopt endpoint.
 */
export default function PetDetail() {
  const { id } = useParams();
  const { role } = useContext(AuthContext);
  const [pet, setPet] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch the pet details on mount
  useEffect(() => {
    petsAPI
      .getPet(id)
      .then(({ data }) => {
        setPet(data);
        setError('');
      })
      .catch(() => setError('Unable to load pet'));
  }, [id]);

  // Handle adoption request submission
  const handleAdopt = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await adoptionAPI.createRequest(id, { message });
      setSuccess('Request sent!');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    }
  };

  if (!pet) {
    return <p>Loading...</p>;
  }

  const defaultImage = 'https://via.placeholder.com/600x400?text=No+Image';

  return (
    <div>
      <h2>{pet.name}</h2>
      {pet.imageURL && (
        <img
          src={pet.imageURL || defaultImage}
          alt={pet.name}
          style={{ width: '100%', maxWidth: '600px', borderRadius: '8px' }}
        />
      )}
      <p>
        <strong>Breed:</strong> {pet.breed || 'Unknown'}
      </p>
      <p>
        <strong>Age:</strong> {pet.age != null ? `${pet.age} yrs` : 'Unknown'}
      </p>
      <p>
        <strong>Location:</strong> {pet.location || 'Unknown'}
      </p>
      {pet.healthNotes && (
        <p>
          <strong>Health Notes:</strong> {pet.healthNotes}
        </p>
      )}
      {role === 'adopter' && (
        <form onSubmit={handleAdopt}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message to shelter"
            required
            rows={3}
          />
          <button type="submit">Send Adoption Request</button>
        </form>
      )}
      {success && <p className="message success">{success}</p>}
      {error && <p className="message error">{error}</p>}
    </div>
  );
}