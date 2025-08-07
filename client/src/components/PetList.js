import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PetCard from './PetCard';
import { 
  HiSearch, 
  HiRefresh, 
  HiFilter,
  HiViewGrid,
  HiViewList,
  HiHeart,
  HiSparkles,
  HiExclamationCircle
} from 'react-icons/hi';

export default function PetList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [filterBy, setFilterBy] = useState(searchParams.get('filter') || 'all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const fetchPets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (sortBy !== 'newest') params.append('sort', sortBy);
      if (filterBy !== 'all') params.append('filter', filterBy);
      
      const res = await fetch(`/api/pets?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch pets');
      
      const data = await res.json();
      setPets(data.data?.pets || data.pets || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (filterBy !== 'all') params.set('filter', filterBy);
    setSearchParams(params);
  }, [query, sortBy, filterBy, setSearchParams]);

  useEffect(() => {
    fetchPets();
  }, [query, sortBy, filterBy]);

  // Memoized filtered and sorted pets
  const processedPets = useMemo(() => {
    const filtered = [...pets];

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => (a.name || a.breed || '').localeCompare(b.name || b.breed || ''));
        break;
      case 'age':
        filtered.sort((a, b) => (a.age || 0) - (b.age || 0));
        break;
      case 'newest':
      default:
        // Assume newest first (could be based on createdAt if available)
        break;
    }

    return filtered;
  }, [pets, sortBy]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPets();
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="h-56 bg-neutral-200 rounded-t-2xl" />
          <div className="p-6 space-y-4">
            <div className="h-5 bg-neutral-200 rounded-lg w-3/4" />
            <div className="h-4 bg-neutral-200 rounded-lg w-1/2" />
            <div className="h-4 bg-neutral-200 rounded-lg w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-24">
      <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-brand-100 to-accent-100 rounded-full flex items-center justify-center">
        <HiSparkles className="w-16 h-16 text-brand" />
      </div>
      <h3 className="text-3xl font-bold text-neutral-900 mb-4">
        No pets found
      </h3>
      <p className="text-xl text-neutral-600 mb-8 max-w-lg mx-auto leading-relaxed">
        {query 
          ? `We couldn't find any pets matching "${query}". Try adjusting your search terms.`
          : "There are no pets available for adoption at the moment. Check back soon!"
        }
      </p>
      {query && (
        <button
          onClick={() => {
            setQuery('');
            setFilterBy('all');
          }}
          className="btn-primary px-8 py-4 rounded-xl font-medium shadow-brand hover:shadow-brand-lg transition-all duration-200"
        >
          Clear Search
        </button>
      )}
    </div>
  );

  const ErrorState = () => (
    <div className="text-center py-24">
      <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
        <HiExclamationCircle className="w-16 h-16 text-red-500" />
      </div>
      <h3 className="text-3xl font-bold text-neutral-900 mb-4">
        Something went wrong
      </h3>
      <p className="text-xl text-neutral-600 mb-8 max-w-lg mx-auto leading-relaxed">
        {error}
      </p>
      <button 
        onClick={fetchPets} 
        className="btn-primary px-8 py-4 rounded-xl font-medium shadow-brand hover:shadow-brand-lg transition-all duration-200"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="py-16 space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-5xl mx-auto px-6">
        <h1 className="text-6xl md:text-7xl font-display font-bold text-neutral-900 mb-8 leading-tight">
          Find Your Perfect
          <span className="gradient-text block mt-2">Companion</span>
        </h1>
        <p className="text-2xl text-neutral-600 leading-relaxed max-w-3xl mx-auto">
          Discover loving pets waiting for their forever homes. Each one has a unique story and is ready to bring joy to your family.
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-6xl mx-auto px-6 space-y-10">
        {/* Main Search Card */}
        <div className="bg-white rounded-3xl shadow-large border border-neutral-100 p-10">
          <form onSubmit={handleSearch} className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Input */}
              <div className="relative flex-1">
                <HiSearch className="absolute left-6 top-1/2 transform -translate-y-1/2 text-neutral-400 w-7 h-7" />
                <input
                  type="text"
                  placeholder="Search by name, breed, or location..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 text-xl border-2 border-neutral-200 rounded-2xl focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all duration-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-8 py-5 rounded-2xl font-semibold transition-all duration-200 flex items-center space-x-3 ${
                    showFilters 
                      ? 'bg-brand text-white shadow-brand' 
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <HiFilter className="w-6 h-6" />
                  <span>Filters</span>
                </button>
                
                <button
                  type="submit"
                  className="btn-primary px-10 py-5 rounded-2xl font-semibold text-xl shadow-brand hover:shadow-brand-lg transition-all duration-200 flex items-center space-x-3"
                >
                  <HiSearch className="w-6 h-6" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-medium p-10 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-neutral-800 uppercase tracking-wider">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-4 px-6 text-lg border-2 border-neutral-200 rounded-xl focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all duration-200"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="age">Age (Youngest)</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-neutral-800 uppercase tracking-wider">
                  Filter by Status
                </label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="w-full py-4 px-6 text-lg border-2 border-neutral-200 rounded-xl focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all duration-200"
                >
                  <option value="all">All Pets</option>
                  <option value="available">Available</option>
                  <option value="pending">Pending Adoption</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSortBy('newest');
                    setFilterBy('all');
                  }}
                  className="w-full py-4 px-6 text-lg font-semibold border-2 border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all duration-200"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 px-4">
          <div className="flex items-center space-x-6">
            <h2 className="text-3xl font-bold text-neutral-900">
              Available Pets
            </h2>
            <span className="bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-lg font-semibold">
              {processedPets.length} found
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* View Toggle */}
            <div className="flex items-center space-x-2 bg-neutral-100 rounded-2xl p-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-4 rounded-xl transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title="Grid View"
              >
                <HiViewGrid className="w-6 h-6" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-4 rounded-xl transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title="List View"
              >
                <HiViewList className="w-6 h-6" />
              </button>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchPets}
              disabled={loading}
              className="px-6 py-4 rounded-xl font-semibold text-neutral-700 hover:bg-neutral-100 transition-all duration-200 flex items-center space-x-3"
              title="Refresh Results"
            >
              <HiRefresh className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-8xl mx-auto px-6">
        {error ? (
          <ErrorState />
        ) : loading ? (
          <LoadingSkeleton />
        ) : processedPets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10' 
              : 'space-y-8 max-w-5xl mx-auto'
            }
          `}>
            {processedPets.map((pet, index) => (
              <div
                key={pet.id || pet._id || index}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <PetCard pet={pet} viewMode={viewMode} />
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && !error && processedPets.length > 0 && (
          <div className="mt-20 text-center">
            <div className="inline-flex items-center space-x-4 text-lg text-neutral-600 bg-gradient-to-r from-neutral-50 to-brand-50 rounded-full px-8 py-4 border border-neutral-200">
              <HiHeart className="w-6 h-6 text-brand" />
              <span className="font-medium">
                Showing {processedPets.length} adorable pet{processedPets.length !== 1 ? 's' : ''} ready for adoption
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
