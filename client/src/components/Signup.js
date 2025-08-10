import { useState } from 'react';
import { FaFacebookF } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

export default function Signup() {
  const [form, setForm]       = useState({
    name: '',
    email: '',
    password: '',
    role: 'adopter',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.signup(form);
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch(err) { } 
    finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      illustration="/images/pets-hero.png"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div className="relative z-0">
          <input
            type="text"
            name="name"
            id="name"
            placeholder=" "
            required
            value={form.name}
            onChange={handleChange}
            className="
              peer block w-full border-0 border-b-2 border-gray-300
              bg-transparent px-0 py-2 text-gray-900
              focus:border-brand focus:outline-none focus:ring-0
              transition
            "
          />
          <label
            htmlFor="name"
            className="
              absolute left-0 top-2 origin-[0] -translate-y-6 scale-75
              transform text-gray-500 duration-300
              peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100
              peer-focus:-translate-y-6 peer-focus:scale-75
            "
          >
            Full Name
          </label>
        </div>

        {/* Email */}
        <div className="relative z-0">
          <input
            type="email"
            name="email"
            id="email"
            placeholder=" "
            required
            value={form.email}
            onChange={handleChange}
            className="
              peer block w-full border-0 border-b-2 border-gray-300
              bg-transparent px-0 py-2 text-gray-900
              focus:border-brand focus:outline-none focus:ring-0
              transition
            "
          />
          <label
            htmlFor="email"
            className="
              absolute left-0 top-2 origin-[0] -translate-y-6 scale-75
              transform text-gray-500 duration-300
              peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100
              peer-focus:-translate-y-6 peer-focus:scale-75
            "
          >
            Email address
          </label>
        </div>

        {/* Password */}
        <div className="relative z-0">
          <input
            type="password"
            name="password"
            id="password"
            placeholder=" "
            required
            value={form.password}
            onChange={handleChange}
            className="
              peer block w-full border-0 border-b-2 border-gray-300
              bg-transparent px-0 py-2 text-gray-900
              focus:border-brand focus:outline-none focus:ring-0
              transition
            "
          />
          <label
            htmlFor="password"
            className="
              absolute left-0 top-2 origin-[0] -translate-y-6 scale-75
              transform text-gray-500 duration-300
              peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100
              peer-focus:-translate-y-6 peer-focus:scale-75
            "
          >
            Password
          </label>
        </div>

        {/* Role select */}
        <div className="relative z-0">
          <select
            name="role"
            id="role"
            value={form.role}
            onChange={handleChange}
            className="
              block w-full border-0 border-b-2 border-gray-300
              bg-transparent px-0 py-2 text-gray-900
              focus:border-brand focus:outline-none focus:ring-0
              transition
            "
          >
            <option value="adopter">Adopter</option>
            <option value="shelter">Shelter</option>
          </select>
          <label
            htmlFor="role"
            className="
              absolute left-0 top-2 origin-[0] -translate-y-6 scale-75
              transform text-gray-500 duration-300 pointer-events-none
            "
          >
            Role
          </label>
        </div>

        {/* Location */}
        <div className="relative z-0">
          <input
            type="text"
            name="location"
            id="location"
            placeholder=" "
            value={form.location}
            onChange={handleChange}
            className="
              peer block w-full border-0 border-b-2 border-gray-300
              bg-transparent px-0 py-2 text-gray-900
              focus:border-brand focus:outline-none focus:ring-0
              transition
            "
          />
          <label
            htmlFor="location"
            className="
              absolute left-0 top-2 origin-[0] -translate-y-6 scale-75
              transform text-gray-500 duration-300
              peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100
              peer-focus:-translate-y-6 peer-focus:scale-75
            "
          >
            Location (optional)
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`
            w-full flex justify-center items-center space-x-2
            rounded-lg py-2 font-medium transition
            ${loading
              ? 'bg-gray-300 cursor-not-allowed text-gray-600'
              : 'bg-brand hover:bg-brand-hover text-white'}
          `}
        >
          {loading ? 'Creating…' : 'Sign up'}
        </button>

        {/* Divider */}
        <div className="flex items-center">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="px-3 text-gray-400">or</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Social signup */}
        <button
          type="button"
          className="
            w-full inline-flex items-center justify-center space-x-2
            border border-gray-300 rounded-lg py-2 hover:shadow
            transition mb-2
          "
        >
          <FcGoogle size={20} />
          <span>Sign up with Google</span>
        </button>
        <button
          type="button"
          className="
            w-full inline-flex items-center justify-center space-x-2
            border border-blue-600 text-blue-600 rounded-lg py-2 hover:bg-blue-50
            transition
          "
        >
          <FaFacebookF size={18} />
          <span>Sign up with Facebook</span>
        </button>

        {/* Link to login */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-brand hover:underline">
            Log in
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}