import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add JWT token to EVERY request automatically
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('Request:', config.method, config.url, 'Token:', token ? '✅' : '❌');
        return config;
    },
    error => Promise.reject(error)
);

// Log responses
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

// Auth APIs
export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);

// Chat APIs
export const createRoom = (name, email) =>
    api.post(`/api/chat/room/create?name=${name}&email=${email}`);
export const joinRoom = (roomId, email) =>
    api.post(`/api/chat/room/${roomId}/join?email=${email}`);
export const getMessages = (roomId) =>
    api.get(`/api/chat/room/${roomId}/messages`);
export const getRooms = (email) =>
    api.get(`/api/chat/rooms?email=${email}`);
export const getRoomsDetailed = (email) =>
    api.get(`/api/chat/rooms/detailed?email=${email}`);
export const getOrCreateDirectChat = (userEmail, targetEmail) =>
    api.post('/api/chat/room/direct', { userEmail, targetEmail });

// User & Contacts APIs
export const getContacts = (email, search = '') =>
    api.get(`/api/users/contacts?email=${email}&search=${encodeURIComponent(search)}`);

// Presence APIs
export const goOnline = (email) =>
    api.post(`/api/presence/online?email=${email}`);
export const goOffline = (email) =>
    api.post(`/api/presence/offline?email=${email}`);
export const getStatus = (email) =>
    api.get(`/api/presence/status?email=${email}`);

export default api;