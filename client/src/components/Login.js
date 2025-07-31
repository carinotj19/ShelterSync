import { useState, useContext } from 'react';
import { FcGoogle } from 'react-icons/fc';
import AuthLayout from './AuthLayout';
import { AuthContext } from '../AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { setToken, setRole } = useContext(AuthContext);
  const [form, setForm]       = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setToken(data.token);
      setRole(data.role);
      toast.success('Welcome back!');
    } catch(err) {
      toast.error(err.message);
    } finally{
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      illustration="/images/pets-hero.png"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ——— Floating label email ——— */}
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

        {/* ——— Floating label password ——— */}
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

        {/* ——— Remember + forgot ——— */}
        <div className="flex justify-between text-sm">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 text-brand" />
            <span className="text-gray-600">Remember me</span>
          </label>
          <a href="/forgot" className="text-brand hover:underline">
            Forgot?
          </a>
        </div>

        {/* ——— Submit button ——— */}
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
          {loading ? 'Signing in…' : 'Log in'}
        </button>

        {/* ——— Or divider ——— */}
        <div className="flex items-center">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="px-3 text-gray-400">or</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {/* ——— Social login ——— */}
        <button
          type="button"
          className="
            w-full inline-flex items-center justify-center space-x-2
            border border-gray-300 rounded-lg py-2 hover:shadow
            transition
          "
        >
          <FcGoogle size={20} />
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <a href="/signup" className="text-brand hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}