import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import toast from 'react-hot-toast';

/**
 * Component for shelters to view and manage adoption requests for their pets.
 * Displays all pending, approved, and rejected requests with the ability to
 * update request status.
 */
export default function AdoptionRequests() {
  const { token } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [updating, setUpdating] = useState(null);

  // Fetch adoption requests for the shelter
  const fetchRequests = async () => {
    try {
      const res = await fetch('/adopt/shelter/requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(data);
      } else {
        toast.error(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  // Update request status
  const updateRequestStatus = async (requestId, status) => {
    setUpdating(requestId);
    try {
      const res = await fetch(`/adopt/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Request ${status}`);
        // Update local state
        setRequests(requests.map(req => 
          req._id === requestId ? { ...req, status } : req
        ));
      } else {
        toast.error(data.error || 'Failed to update request');
      }
    } catch (err) {
      toast.error('Failed to update request');
    } finally {
      setUpdating(null);
    }
  };

  // Filter requests based on status
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  // Group requests by pet
  const requestsByPet = filteredRequests.reduce((acc, req) => {
    const petId = req.pet._id;
    if (!acc[petId]) {
      acc[petId] = {
        pet: req.pet,
        requests: []
      };
    }
    acc[petId].requests.push(req);
    return acc;
  }, {});

  if (loading) {
    return <div className="text-center py-8">Loading adoption requests...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Adoption Requests</h2>
      
      {/* Filter buttons */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded ${
            filter === 'pending' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded ${
            filter === 'approved' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Approved ({requests.filter(r => r.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded ${
            filter === 'rejected' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Rejected ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No {filter !== 'all' ? filter : ''} adoption requests found.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.values(requestsByPet).map(({ pet, requests }) => (
            <div key={pet._id} className="bg-white rounded-lg shadow-md p-6">
              {/* Pet info */}
              <div className="flex items-start gap-4 mb-4 pb-4 border-b">
                {pet.imageURL && (
                  <img
                    src={pet.imageURL}
                    alt={pet.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">{pet.name}</h3>
                  <p className="text-gray-600">{pet.breed}</p>
                </div>
              </div>

              {/* Requests for this pet */}
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">
                            {request.adopter.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              request.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Email: {request.adopter.email}
                        </p>
                        {request.adopter.location && (
                          <p className="text-sm text-gray-600 mb-1">
                            Location: {request.adopter.location}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-2">
                          Submitted: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        {request.message && (
                          <div className="mt-2 p-3 bg-white rounded border">
                            <p className="text-sm font-medium mb-1">Message:</p>
                            <p className="text-sm text-gray-700">{request.message}</p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => updateRequestStatus(request._id, 'approved')}
                            disabled={updating === request._id}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {updating === request._id ? 'Updating...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => updateRequestStatus(request._id, 'rejected')}
                            disabled={updating === request._id}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            {updating === request._id ? 'Updating...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
