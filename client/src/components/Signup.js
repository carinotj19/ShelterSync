import { useState } from 'react';
import { FaFacebookF } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

export default function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'adopter',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (form.location.trim()) {
      if (form.location.trim().length < 2) {
        newErrors.location = 'Location must be at least 2 characters';
      } else if (form.location.trim().length > 100) {
        newErrors.location = 'Location cannot exceed 100 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await authAPI.signup(form);
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.errors || err.response?.data?.message || 'Signup failed';
      toast.error(message);
      setErrors({ general: message });
    }
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
        {errors.general && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-xl text-sm">
            {errors.general}
          </div>
        )}
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
            className={`
              peer block w-full border-0 border-b-2 ${errors.name ? 'border-error-500' : 'border-gray-300'}
              bg-transparent px-0 py-2 text-gray-900
              focus:border-brand focus:outline-none focus:ring-0
              transition
            `}
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
        {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
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
            className={`
              peer block w-full border-0 border-b-2 ${errors.email ? 'border-error-500' : 'border-gray-300'}
              bg-transparent px-0 py-2 text-gray-900
              focus:border-brand focus:outline-none focus:ring-0
              transition
            `}
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
        {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
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
            className={`
              peer block w-full border-0 border-b-2 ${errors.password ? 'border-error-500' : 'border-gray-300'}
              bg-transparent px-0 py-2 text-gray-900
              focus:border-brand focus:outline-none focus:ring-0
              transition
            `}
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
        {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
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
          <Link to="/login" className="text-brand hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
