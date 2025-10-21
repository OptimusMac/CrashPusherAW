import { api } from './crashApi';

// Get users list with search
export const fetchUsers = (q = "") => 
  api.get("/admin/users", { params: { q } }).then(r => r.data);

// Update user
export const updateUser = (userId, userData) => 
  api.put(`/admin/users/${userId}`, userData).then(r => r.data);

// Delete user
export const deleteUser = (userId) => 
  api.delete(`/admin/users/${userId}`).then(r => r.data);

// Create new user
export const createUser = (userData) => 
  api.post("/admin/users", userData).then(r => r.data);