import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import toast from 'react-hot-toast';

/**
 * Admin dashboard for managing the entire platform.
 * Provides overview statistics and management capabilities for users, pets, and adoption requests.
 */
export default function AdminDashboard() {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPets: 0,
    totalRequests: 0,
    pendingRequests: 0,
  });
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data for admin dashboard
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch users
        const usersRes = await fetch('/auth/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await usersRes.json();
        if (usersRes.ok) setUsers(usersData);

        // Fetch all pets
        const petsRes = await fetch('/pets');
        const petsData = await petsRes.json();
        if (petsRes.ok) setPets(petsData);

        // Fetch all adoption requests
        const requestsRes = await fetch('/adopt/admin/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const requestsData = await requestsRes.json();
        if (requestsRes.ok) setRequests(requestsData);

        // Calculate stats
        setStats({
          totalUsers: usersData.length || 0,
          totalPets: petsData.length || 0,
          totalRequests: requestsData.length || 0,
          pendingRequests: requestsData.filter(r => r.status === 'pending').length || 0,
        });
      } catch (err) {
        toast.error('Failed to fetch admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [token]);

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const res = await fetch(`/auth/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        toast.success('User deleted successfully');
        setUsers(users.filter(u => u._id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  // Delete pet
  const deletePet = async (petId) => {
    if (!window.confirm('Are you sure you want to delete this pet?')) return;
    
    try {
      const res = await fetch(`/pets/${petId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        toast.success('Pet deleted successfully');
        setPets(pets.filter(p => p._id !== petId));
        setStats(prev => ({ ...prev, totalPets: prev.totalPets - 1 }));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete pet');
      }
    } catch (err) {
      toast.error('Failed to delete pet');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading admin dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900">Total Pets</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalPets}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900">Total Requests</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalRequests}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900">Pending Requests</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingRequests}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('pets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pets
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Adoption Requests
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {requests.slice(0, 5).map(request => (
                <div key={request._id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">
                      {request.adopter.name} requested to adopt {request.pet.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'shelter'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.location || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'pets' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pets.map(pet => (
                <tr key={pet._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{pet.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{pet.breed || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{pet.age || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{pet.location || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => deletePet(pet._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">
                    {request.adopter.name} → {request.pet.name}
                  </h3>
                  <p className="text-gray-600">
                    Shelter: {request.pet.shelter?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  {request.message && (
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      <p className="text-sm">{request.message}</p>
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1 text-sm rounded ${
                  request.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : request.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {request.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
