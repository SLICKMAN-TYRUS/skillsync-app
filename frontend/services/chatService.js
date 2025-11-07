// services/chatService.js
import io from 'socket.io-client';
import api from './api';

const SOCKET_URL = 'https://your-backend.com'; // <-- change to your socket server
let socket = null;

export async function fetchChats() {
  const res = await api.get('/chats');
  return res.data;
}

export async function fetchMessages(chatId) {
  const res = await api.get(`/chats/${chatId}/messages`);
  return res.data;
}

export async function sendMessageREST(chatId, text) {
  const res = await api.post(`/chats/${chatId}/messages`, { text });
  return res.data;
}

export async function connectSocket(authToken) {
  if (socket && socket.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token: authToken },
    transports: ['websocket'],
  });

  socket.on('connect', () => console.log('socket connected', socket.id));
  socket.on('connect_error', (err) => console.warn('socket connect_error', err));

  return socket;
}

export function subscribeToEvent(event, cb) {
  if (!socket) return;
  socket.on(event, cb);
}

export function emit(event, payload) {
  if (!socket) return;
  socket.emit(event, payload);
}

