import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PetList from '../components/PetList';
import PetDetail from '../components/PetDetail';
import PetForm from '../components/PetForm';
import Login from '../components/Login';
import Signup from '../components/Signup';

function App() {
	const [token, setToken] = useState(localStorage.getItem('token') || '');
	const [role, setRole] = useState(localStorage.getItem('role') || '');

	useEffect(() => {
		if (token) localStorage.setItem('token', token);
		if (role) localStorage.setItem('role', role);
	}, [token, role]);

	const logout = () => {
		setToken('');
		setRole('');
		localStorage.removeItem('token');
		localStorage.removeItem('role');
	};

	return (
		<Router>
			<nav style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
				<Link to="/">Pets</Link>
				{token ? (
					<>
						{role === 'shelter' && <Link to="/add">Add Pet</Link>}
						<button onClick={logout}>Logout</button>
					</>
				) : (
					<>
						<Link to="/login">Login</Link>
						<Link to="/signup">Signup</Link>
					</>
				)}
			</nav>
			<Routes>
				<Route path="/" element={<PetList />} />
				<Route path="/pets/:id" element={<PetDetail token={token} role={role} />} />
				<Route path="/add" element={<PetForm token={token} />} />
				<Route path="/login" element={<Login setToken={setToken} setRole={setRole} />} />
				<Route path="/signup" element={<Signup />} />
			</Routes>
		</Router>
	);
}

export default App;
