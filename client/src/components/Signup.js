import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'adopter', location: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      toast.success('Welcome aboard! 🎉');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: 'name', label: 'Full Name', type: 'text' },
          { name: 'email', label: 'Email Address', type: 'email' },
          { name: 'password', label: 'Password', type: 'password' },
        ].map(field => (
          <div key={field.name}>
            <label className="block text-gray-700 mb-1" htmlFor={field.name}>
              {field.label}
            </label>
            <div className="relative">
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={form[field.name]}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand transition"
              />
              {field.name === 'password' && (
                // you can build a Show/Hide toggle here
                <button type="button" className="absolute right-3 top-2 text-gray-500">
                  👁
                </button>
              )}
            </div>
          </div>
        ))}

        <div>
          <label className="block text-gray-700 mb-1" htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand transition"
          >
            <option value="adopter">Adopter</option>
            <option value="shelter">Shelter</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1" htmlFor="location">
            Location (optional)
          </label>
          <input
            name="location"
            id="location"
            value={form.location}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full text-white font-medium py-2 rounded-lg transition
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand hover:bg-brand-hover'}
          `}
        >
          {loading ? 'Signing you up...' : 'Sign up'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-brand hover:underline">Log in</a>
        </p>
      </form>
    </AuthLayout>
  );
}
