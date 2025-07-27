import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Signup form for creating new accounts. Users can select the role they
 * want to register as (adopter or shelter). After successful signup
 * the user is redirected to the login page.
 */
export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('adopter');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, location }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError('Signup failed');
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <div>
          <label htmlFor="role">Role:</label>{' '}
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="adopter">Adopter</option>
            <option value="shelter">Shelter</option>
          </select>
        </div>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
        />
        <button type="submit">Signup</button>
      </form>
      {error && <p className="message error">{error}</p>}
    </div>
  );
}