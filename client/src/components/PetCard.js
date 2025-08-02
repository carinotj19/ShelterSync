import { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { 
  HiHeart, 
  HiOutlineHeart, 
  HiLocationMarker, 
  HiCalendar,
  HiSparkles,
  HiEye
} from 'react-icons/hi';

export default function PetCard({ pet }) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLikeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: { text: 'Available', class: 'badge-success' },
      pending: { text: 'Pending', class: 'badge-warning' },
      adopted: { text: 'Adopted', class: 'badge-error' },
    };
    return badges[status] || badges.available;
  };

  const statusBadge = getStatusBadge(pet.status || 'available');

  return (
    <div className="group card-interactive animate-fade-in-up">
      <Link to={`/pets/${pet.id}`} className="block">
        {/* Image Container */}
        <div className="relative h-48 w-full bg-neutral-100 overflow-hidden">
          {/* Loading Skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 skeleton" />
          )}
          
          {/* Pet Image */}
          <img
            src={pet.imageUrl || pet.imageURL || '/api/placeholder/400/300'}
            alt={`${pet.name || pet.breed} - Available for adoption`}
            className={`
              h-full w-full object-cover transition-all duration-500 group-hover:scale-110
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
          
          {/* Error Fallback */}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
              <div className="text-center text-neutral-400">
                <HiSparkles className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Photo coming soon</p>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={`${statusBadge.class} shadow-soft`}>
              {statusBadge.text}
            </span>
          </div>

          {/* Like Button */}
          <button
            onClick={handleLikeClick}
            className={`
              absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200
              ${isLiked 
                ? 'bg-error/90 text-white shadow-brand' 
                : 'bg-white/90 text-neutral-600 hover:bg-white hover:text-error'
              }
            `}
          >
            {isLiked ? (
              <HiHeart className="w-5 h-5" />
            ) : (
              <HiOutlineHeart className="w-5 h-5" />
            )}
          </button>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-large">
                <HiEye className="w-6 h-6 text-brand" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Pet Name & Breed */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-brand transition-colors duration-200">
              {pet.name || 'Adorable Pet'}
            </h3>
            {pet.breed && (
              <p className="text-sm text-neutral-600 font-medium">
                {pet.breed}
              </p>
            )}
          </div>

          {/* Pet Details */}
          <div className="space-y-2 mb-4">
            {pet.age && (
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <HiCalendar className="w-4 h-4 text-neutral-400" />
                <span>{pet.age} years old</span>
              </div>
            )}
            
            {pet.location && (
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <HiLocationMarker className="w-4 h-4 text-neutral-400" />
                <span>{pet.location}</span>
              </div>
            )}
          </div>

          {/* Health Notes Preview */}
          {pet.healthNotes && (
            <div className="mb-4">
              <p className="text-xs text-neutral-500 line-clamp-2">
                {pet.healthNotes}
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="inline-flex items-center space-x-2 text-brand font-medium text-sm group-hover:text-brand-600 transition-colors duration-200">
                <span>View Details</span>
                <svg 
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-1 text-xs text-neutral-400">
              <HiHeart className="w-3 h-3" />
              <span>{Math.floor(Math.random() * 50) + 10}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

PetCard.propTypes = {
  pet: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    breed: PropTypes.string,
    age: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    location: PropTypes.string,
    imageUrl: PropTypes.string,
    imageURL: PropTypes.string,
    healthNotes: PropTypes.string,
    status: PropTypes.oneOf(['available', 'pending', 'adopted']),
  }).isRequired,
};
