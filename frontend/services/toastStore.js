import { useEffect, useState } from 'react';

const subscribers = new Set();

let counter = 0;
const queue = [];

function notifySubscribers() {
  for (const cb of subscribers) {
    cb(queue.slice());
  }
}

export function pushToast({ type = 'info', message, duration = 5000 }) {
  const id = ++counter;
  queue.push({ id, type, message, createdAt: Date.now(), duration });
  notifySubscribers();
  setTimeout(() => dismissToast(id), duration);
  return id;
}

export function dismissToast(id) {
  const index = queue.findIndex((toast) => toast.id === id);
  if (index >= 0) {
    queue.splice(index, 1);
    notifySubscribers();
  }
}

export function useToastQueue() {
  const [items, setItems] = useState(queue.slice());

  useEffect(() => {
    const handler = (next) => setItems(next);
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, []);

  return items;
}