import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import toast from 'react-hot-toast';

/**
 * Component for adopters to view their submitted adoption requests.
 * Shows the status of each request and details about the pets.
 */
export default function MyAdoptionRequests() {
  const { token } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const res = await fetch('/adopt/my-requests', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setRequests(data);
        } else {
          toast.error(data.error || 'Failed to fetch your requests');
        }
      } catch (err) {
        toast.error('Failed to fetch your requests');
      } finally {
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, [token]);

  if (loading) {
    return <div className="text-center py-8">Loading your adoption requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">My Adoption Requests</h2>
        <p className="text-gray-600 mb-4">You haven't submitted any adoption requests yet.</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Browse Available Pets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">My Adoption Requests</h2>
      
      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex gap-4">
              {/* Pet image */}
              {request.pet.imageURL && (
                <img
                  src={request.pet.imageURL}
                  alt={request.pet.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              
              {/* Request details */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-semibold">
                      <Link
                        to={`/pets/${request.pet._id}`}
                        className="hover:text-blue-600"
                      >
                        {request.pet.name}
                      </Link>
                    </h3>
                    <p className="text-gray-600">
                      {request.pet.breed} • {request.pet.location}
                    </p>
                  </div>
                  
                  {/* Status badge */}
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                
                {/* Dates */}
                <p className="text-sm text-gray-500 mb-2">
                  Submitted on {new Date(request.createdAt).toLocaleDateString()}
                </p>
                
                {/* Message */}
                {request.message && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-1">Your message:</p>
                    <p className="text-sm text-gray-600">{request.message}</p>
                  </div>
                )}
                
                {/* Status-specific messages */}
                {request.status === 'approved' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      <strong>Congratulations!</strong> Your adoption request has been approved. 
                      The shelter will contact you soon with next steps.
                    </p>
                  </div>
                )}
                
                {request.status === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      Unfortunately, your adoption request was not approved. 
                      Don't give up - there are many other pets looking for homes!
                    </p>
                  </div>
                )}
                
                {request.status === 'pending' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      Your request is being reviewed by the shelter. 
                      You'll receive an email once a decision is made.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
