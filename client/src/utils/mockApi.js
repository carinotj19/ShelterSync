import { mockPets, mockRequests, mockUsers } from './mockData';

const DEFAULT_IMAGE = 'https://placehold.co/800x600?text=Pet+photo';
const latency = (result, ms = 200) =>
  new Promise((resolve) => setTimeout(() => resolve(result), ms));
const ok = (data) => latency({ data });
const fail = (message, status = 400) =>
  Promise.reject({ response: { data: { message }, status } });
const clone = (val) => JSON.parse(JSON.stringify(val));

let pets = clone(mockPets);
let users = clone(mockUsers);
let requests = clone(mockRequests);

const getStoredAuth = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const extractUserIdFromToken = () => {
  const auth = getStoredAuth();
  if (auth?.token?.startsWith('mock-')) {
    return auth.token.replace('mock-', '');
  }
  return null;
};

let currentUserId = extractUserIdFromToken();

const scrubUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const getCurrentUser = () => {
  const id = currentUserId || extractUserIdFromToken();
  return users.find((u) => u._id === id) || null;
};

const ensureId = (val) => {
  if (!val) return null;
  if (val._id && val.id) return val;
  return { ...val, _id: val._id || val.id, id: val.id || val._id };
};

const getShelterForPet = () => {
  const current = getCurrentUser();
  if (current && current.role === 'shelter') {
    return scrubUser(current);
  }
  return scrubUser(users.find((u) => u.role === 'shelter')) || null;
};

const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}`;

export const authAPI = {
  login: async ({ email, password }) => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      return fail('Invalid email or password', 401);
    }
    currentUserId = user._id;
    const token = `mock-${user._id}`;
    return ok({ data: { token, user: scrubUser(user) } });
  },

  signup: async (payload) => {
    const exists = users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (exists) return fail('Email already exists', 409);

    const newUser = ensureId({
      ...payload,
      _id: nextId('u'),
      role: payload.role || 'adopter',
    });
    users = [...users, newUser];
    return ok({ data: { user: scrubUser(newUser), message: 'Account created' } });
  },

  getProfile: async () => {
    const user = getCurrentUser() || users.find((u) => u.role === 'adopter');
    if (!user) return fail('Not authenticated', 401);
    return ok({ user: scrubUser(user) });
  },

  updateProfile: async (data) => {
    const user = getCurrentUser();
    if (!user) return fail('Not authenticated', 401);
    users = users.map((u) => (u._id === user._id ? { ...u, ...data } : u));
    const updated = users.find((u) => u._id === user._id);
    return ok({ user: scrubUser(updated) });
  },

  changePassword: async () => ok({ message: 'Password updated (mock)' }),
  forgotPassword: async () => ok({ message: 'Reset link sent (mock)' }),
  resetPassword: async () => ok({ message: 'Password reset (mock)' }),
  verifyEmail: async () => ok({ message: 'Email verified (mock)' }),
  refreshToken: async () => {
    const user = getCurrentUser();
    if (!user) return fail('Not authenticated', 401);
    return ok({ token: `mock-${user._id}` });
  },
};

export const petsAPI = {
  getPets: async (params = {}) => {
    let results = [...pets];

    if (params.search) {
      const term = params.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.breed?.toLowerCase().includes(term) ||
          p.location?.toLowerCase().includes(term)
      );
    }

    if (params.status && params.status !== 'all') {
      const status = params.status.toLowerCase();
      results = results.filter((p) => (p.adoptionStatus || '').toLowerCase() === status);
    }

    switch (params.sort) {
      case 'name':
        results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'age':
        results.sort((a, b) => (a.age || 0) - (b.age || 0));
        break;
      case 'newest':
      default:
        results.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }

    return ok({ data: { pets: results.map(ensureId) } });
  },

  getPet: async (id) => {
    const pet = pets.find((p) => p._id === id || p.id === id);
    if (!pet) return fail('Pet not found', 404);
    return ok({ data: { pet: ensureId(pet) } });
  },

  createPet: async (formData) => {
    const toValue = (key) => {
      if (!formData || typeof formData.get !== 'function') return null;
      return formData.get(key);
    };

    const file = toValue('image');
    let imageURL = DEFAULT_IMAGE;
    if (typeof file === 'string' && file) {
      imageURL = file;
    } else if (file && typeof URL !== 'undefined') {
      try {
        imageURL = URL.createObjectURL(file);
      } catch {
        imageURL = DEFAULT_IMAGE;
      }
    }

    const pet = ensureId({
      _id: nextId('p'),
      name: toValue('name') || 'New friend',
      breed: toValue('breed') || 'Mixed',
      age: Number(toValue('age')) || null,
      location: toValue('location') || 'Unknown',
      healthNotes: toValue('healthNotes') || '',
      imageURL,
      adoptionStatus: 'available',
      shelter: getShelterForPet(),
      createdAt: new Date().toISOString(),
    });

    pets = [pet, ...pets];
    return ok({ data: { pet } });
  },

  updatePet: async (id, formData) => {
    const idx = pets.findIndex((p) => p._id === id || p.id === id);
    if (idx === -1) return fail('Pet not found', 404);

    const toValue = (key) => {
      if (!formData || typeof formData.get !== 'function') return null;
      return formData.get(key);
    };

    const updated = {
      ...pets[idx],
      name: toValue('name') || pets[idx].name,
      breed: toValue('breed') || pets[idx].breed,
      age: Number(toValue('age')) || pets[idx].age,
      location: toValue('location') || pets[idx].location,
      healthNotes: toValue('healthNotes') || pets[idx].healthNotes,
    };

    pets[idx] = ensureId(updated);
    return ok({ data: { pet: pets[idx] } });
  },

  deletePet: async (id) => {
    pets = pets.filter((p) => p._id !== id && p.id !== id);
    requests = requests.filter((r) => r.pet._id !== id && r.pet.id !== id);
    return ok({ message: 'Pet deleted (mock)' });
  },

  getFeaturedPets: async (limit = 4) => {
    return ok({ data: pets.slice(0, limit).map(ensureId) });
  },

  getPetStatistics: async () => {
    const counts = pets.reduce(
      (acc, pet) => {
        const status = (pet.adoptionStatus || '').toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { total: pets.length }
    );
    return ok({ data: counts });
  },

  getShelterPets: async (shelterId) => {
    const id = shelterId || getShelterForPet()?._id;
    const filtered = pets.filter((p) => p.shelter?._id === id);
    return ok({ data: { pets: filtered.map(ensureId) } });
  },

  toggleFeatured: async () => ok({ message: 'Toggled (mock)' }),
  markAsAdopted: async (id) => {
    pets = pets.map((p) =>
      p._id === id || p.id === id ? { ...p, adoptionStatus: 'adopted' } : p
    );
    return ok({ message: 'Marked as adopted (mock)' });
  },
};

export const adoptionAPI = {
  createRequest: async (petId, data = {}) => {
    const pet = pets.find((p) => p._id === petId || p.id === petId);
    if (!pet) return fail('Pet not found', 404);

    const adopter = getCurrentUser() || users.find((u) => u.role === 'adopter');
    if (!adopter) return fail('No adopter profile found', 400);

    const request = ensureId({
      _id: nextId('r'),
      pet: ensureId(pet),
      adopter: scrubUser(adopter),
      status: 'pending',
      message: data.message || '',
      createdAt: new Date().toISOString(),
    });

    requests = [request, ...requests];
    return ok({ data: request });
  },

  getMyRequests: async () => {
    const adopter = getCurrentUser();
    if (!adopter) return ok([]);
    const mine = requests.filter((r) => r.adopter?._id === adopter._id);
    return ok(mine.map(ensureId));
  },

  getShelterRequests: async (shelterId) => {
    const shelter = shelterId
      ? users.find((u) => u._id === shelterId)
      : getCurrentUser() || users.find((u) => u.role === 'shelter');

    if (!shelter) return ok([]);
    const filtered = requests.filter((r) => r.pet?.shelter?._id === shelter._id);
    return ok(filtered.map(ensureId));
  },

  getRequest: async (id) => {
    const req = requests.find((r) => r._id === id || r.id === id);
    if (!req) return fail('Request not found', 404);
    return ok(ensureId(req));
  },

  approveRequest: async (id, response) => adoptionAPI.updateRequestStatus(id, 'approved', response),
  rejectRequest: async (id, response) => adoptionAPI.updateRequestStatus(id, 'rejected', response),
  withdrawRequest: async (id) => adoptionAPI.updateRequestStatus(id, 'withdrawn'),

  addNote: async () => ok({ message: 'Note added (mock)' }),

  getStatistics: async () => {
    const stats = requests.reduce(
      (acc, r) => {
        acc.total += 1;
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );
    return ok({ data: stats });
  },

  updateRequestStatus: async (id, status) => {
    requests = requests.map((r) => (r._id === id || r.id === id ? { ...r, status } : r));
    const updated = requests.find((r) => r._id === id || r.id === id);
    if (!updated) return fail('Request not found', 404);
    return ok(ensureId(updated));
  },
};

export const adminAPI = {
  getUsers: async () => ok(users.map(scrubUser)),

  deleteUser: async (userId) => {
    users = users.filter((u) => u._id !== userId && u.id !== userId);
    requests = requests.filter((r) => r.adopter?._id !== userId);
    return ok({ message: 'User deleted (mock)' });
  },

  getAllRequests: async () => ok(requests.map(ensureId)),
};

export const uploadImage = async () =>
  ok({ url: DEFAULT_IMAGE, message: 'Uploads are mocked in demo mode.' });

export const downloadFile = async () => ok({ message: 'Download mocked' });

export const healthCheck = async () => ok({ status: 'ok', mode: 'mock' });

// Minimal axios-like shim so existing code can still `import api from './api'`
export const mockApiClient = {
  get: (url, config = {}) => {
    if (url === '/pets') return petsAPI.getPets(config.params);
    if (url.startsWith('/pets/')) return petsAPI.getPet(url.split('/').pop());
    if (url === '/auth/admin/users') return adminAPI.getUsers();
    if (url === '/adopt/admin/all') return adminAPI.getAllRequests();
    if (url === '/adopt/shelter/requests') return adoptionAPI.getShelterRequests();
    if (url === '/adopt/my-requests') return adoptionAPI.getMyRequests();
    if (url === '/health') return healthCheck();
    return ok({});
  },

  post: (url, data) => {
    if (url === '/auth/login') return authAPI.login(data);
    if (url === '/auth/signup') return authAPI.signup(data);
    if (url.startsWith('/pets')) return petsAPI.createPet(data);
    if (url.startsWith('/adopt/')) {
      const petId = url.replace('/adopt/', '').split('/')[0];
      return adoptionAPI.createRequest(petId, data);
    }
    return ok({});
  },

  patch: (url, data) => {
    if (url.includes('/status')) {
      const id = url.replace('/adopt/', '').replace('/status', '');
      return adoptionAPI.updateRequestStatus(id, data?.status);
    }
    if (url.includes('/approve')) {
      const id = url.replace('/adopt/', '').replace('/approve', '');
      return adoptionAPI.approveRequest(id);
    }
    if (url.includes('/reject')) {
      const id = url.replace('/adopt/', '').replace('/reject', '');
      return adoptionAPI.rejectRequest(id);
    }
    if (url.includes('/withdraw')) {
      const id = url.replace('/adopt/', '').replace('/withdraw', '');
      return adoptionAPI.withdrawRequest(id);
    }
    if (url.startsWith('/pets/')) {
      const id = url.replace('/pets/', '');
      return petsAPI.updatePet(id, data);
    }
    return ok({});
  },

  delete: (url) => {
    if (url.startsWith('/pets/')) return petsAPI.deletePet(url.replace('/pets/', ''));
    if (url.startsWith('/auth/admin/users/')) {
      return adminAPI.deleteUser(url.replace('/auth/admin/users/', ''));
    }
    return ok({});
  },
};
