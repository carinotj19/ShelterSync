import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

/**
 * Shows detailed information for a single pet. Adopters can submit an
 * adoption request by filling a message and clicking the button. The
 * request is sent via the authenticated /adopt endpoint.
 */
function PetDetail({ token, role }) {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/pets/${id}`)
      .then((res) => res.json())
      .then(setPet)
      .catch(() => setError('Unable to load pet'));
  }, [id]);

  const handleAdopt = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/adopt/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed');
      } else {
        setSuccess('Request sent');
        setMessage('');
      }
    } catch (err) {
      setError('Request failed');
    }
  };

  if (!pet) return <p>Loading...</p>;

  return (
    <div>
      <h3>{pet.name}</h3>
      {pet.imageURL && (
        <img
          src={pet.imageURL}
          alt={pet.name}
          style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'cover' }}
        />
      )}
      <p>Breed: {pet.breed || 'Unknown'}</p>
      <p>Age: {pet.age != null ? pet.age : 'Unknown'}</p>
      <p>Location: {pet.location || 'Unknown'}</p>
      <p>{pet.healthNotes}</p>
      {role === 'adopter' && (
        <form onSubmit={handleAdopt} style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px' }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message to shelter"
            required
          />
          <button type="submit">Send Adoption Request</button>
        </form>
      )}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default PetDetail;