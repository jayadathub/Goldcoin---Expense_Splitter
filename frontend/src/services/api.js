import axios from 'axios';

// Base Axios instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://goldcoin-expense-splitter.onrender.com/api' : 'http://localhost:5000/api'),
  withCredentials: true, // Send and receive cookies
});

// Interceptor to attach token from localStorage if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const logoutUser = () => API.post('/auth/logout');
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Groups API calls
export const getMyGroups = () => API.get('/groups');
export const getGroupById = (groupId) => API.get(`/groups/${groupId}`);
export const getRecentMembers = () => API.get('/groups/recent-members');
export const createGroup = (data) => API.post('/groups', data);
export const updateGroup = (groupId, data) => API.put(`/groups/${groupId}`, data);
export const inviteMember = (groupId, data) => API.post(`/groups/${groupId}/invite`, data);

// Expenses API calls
export const addExpense = (data) => API.post('/expenses', data);
export const getGroupExpenses = (groupId, params) => API.get(`/expenses/group/${groupId}`, { params });
export const getGroupBalances = (groupId) => API.get(`/expenses/group/${groupId}/balances`);
export const updateExpense = (expenseId, data) => API.put(`/expenses/${expenseId}`, data);
export const deleteExpense = (expenseId) => API.delete(`/expenses/${expenseId}`);

// Settlements API calls
export const createSettlement = (data) => API.post('/settlements', data);
export const getGroupSettlements = (groupId) => API.get(`/settlements/group/${groupId}`);

// Trip Clusters API calls
export const createCluster = (data) => API.post('/clusters', data);
export const getMyClusters = () => API.get('/clusters');
export const getClusterById = (clusterId) => API.get(`/clusters/${clusterId}`);
export const getClusterBalances = (clusterId) => API.get(`/clusters/${clusterId}/balances`);
export const updateCluster = (clusterId, data) => API.put(`/clusters/${clusterId}`, data);
export const deleteCluster = (clusterId) => API.delete(`/clusters/${clusterId}`);

export default API;
