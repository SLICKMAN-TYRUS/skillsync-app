import api from './api';

// Simple polling-based notification service for quick demo/live preview.
// Usage:
//  startPolling();
//  const id = subscribe(callback);
//  unsubscribe(id);
//  stopPolling();

const POLL_INTERVAL = 5000; // ms

let intervalId = null;
let lastFetchAt = null;
const subscribers = new Set();

const notifyAll = (payload) => {
  subscribers.forEach((cb) => {
    try {
      cb(payload);
    } catch (e) {
      // ignore subscriber errors
    }
  });
};

const fetchSummary = async () => {
  try {
    const [countResp, recentResp] = await Promise.all([
      api.get('/notifications/unread-count'),
      api.get('/notifications/recent?limit=20'),
    ]);

    const unread = countResp?.data?.unread_count || 0;
    const recent = Array.isArray(recentResp?.data) ? recentResp.data : [];
    lastFetchAt = Date.now();
    return { unreadCount: unread, recent };
  } catch (err) {
    return { unreadCount: 0, recent: [] };
  }
};

export const startPolling = (intervalMs = POLL_INTERVAL) => {
  if (intervalId) return;
  // immediate fetch then interval
  (async () => {
    const data = await fetchSummary();
    notifyAll(data);
  })();

  intervalId = setInterval(async () => {
    const data = await fetchSummary();
    notifyAll(data);
  }, intervalMs);
};

export const stopPolling = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

export const subscribe = (cb) => {
  subscribers.add(cb);
  // return id (function) for convenience
  return cb;
};

export const unsubscribe = (cb) => {
  subscribers.delete(cb);
};

export const getRecent = async (limit = 20) => {
  try {
    const resp = await api.get(`/notifications/recent?limit=${limit}`);
    return Array.isArray(resp.data) ? resp.data : [];
  } catch (e) {
    return [];
  }
};

export const markAllRead = async () => {
  try {
    const resp = await api.patch('/notifications/read-all');
    return resp.data;
  } catch (e) {
    return null;
  }
};

export const markRead = async (notificationId) => {
  try {
    const resp = await api.patch(`/notifications/${notificationId}/read`);
    return resp.data;
  } catch (e) {
    return null;
  }
};

export default {
  startPolling,
  stopPolling,
  subscribe,
  unsubscribe,
  getRecent,
  markAllRead,
  markRead,
};
