import { api } from './crashApi';

// Get users list with search
export const fetchUsers = (q = "") => 
  api.get("/admin/users", { params: { q } }).then(r => r.data);

export const fetchEventTypes = () =>
  api.get("/admin/logs/event-types").then(r => r.data);

// Update user
export const updateUser = (userId, userData) => 
  api.put(`/admin/users/${userId}`, userData).then(r => r.data);

// Delete user
export const deleteUser = (userId) => 
  api.delete(`/admin/users/${userId}`).then(r => r.data);

// Create new user
export const createUser = (userData) => 
  api.post("/admin/users", userData).then(r => r.data);

// Get logs list with search and filters
export const fetchLogs = (params = {}) => 
  api.get("/admin/logs/fetch", { params }).then(r => r.data);

// Get logs statistics
export const fetchLogsStats = (params = {}) => 
  api.get("/admin/logs/stats", { params }).then(r => r.data);

// Get log by ID
export const fetchLogById = (logId) => 
  api.get(`/admin/logs/${logId}`).then(r => r.data);

// Delete log by ID
export const deleteLog = (logId) => 
  api.delete(`/admin/logs/${logId}`).then(r => r.data);

// Delete multiple logs
export const deleteLogs = (logIds) => 
  api.delete("/admin/logs/batch", { data: { logIds } }).then(r => r.data);

// Get available log types
export const fetchLogTypes = () => 
  api.get("/admin/logs/types").then(r => r.data);

// Get players list from logs
export const fetchLogPlayers = () => 
  api.get("/admin/logs/players").then(r => r.data);

// Export logs to file
export const exportLogs = (params = {}) => 
  api.get("/admin/logs/export", { 
    params,
    responseType: 'blob'
  }).then(r => r.data);
  
export const backItem = (logId) => 
  api.post("/admin/users/back-item", null, { 
    params: { id: logId } 
  }).then(r => r.data);