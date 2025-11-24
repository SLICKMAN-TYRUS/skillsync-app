import { getDevAuthHeader } from './devAuth';

const DEFAULT_ENDPOINT = '/api/notifications/stream';

export default class EventStreamClient {
  constructor(endpoint = DEFAULT_ENDPOINT) {
    this.endpoint = endpoint;
    this.eventSource = null;
    this.listeners = new Map();
    this.retryDelayMs = 3000;
  }

  connect() {
    if (this.eventSource) {
      return;
    }
    const url = new URL(this.endpoint, window.location.origin);

    let token = null;
    if (typeof window !== 'undefined') {
      token = window.localStorage.getItem('auth_token');
      if (!token) {
        const devHeader = getDevAuthHeader ? getDevAuthHeader() : null;
        if (devHeader && devHeader.startsWith('Bearer ')) {
          token = devHeader.slice('Bearer '.length);
        }
      }
    }

    if (token) {
      url.searchParams.set('access_token', token);
    }

    const source = new EventSource(url.toString(), { withCredentials: true });
    this.eventSource = source;

    source.onmessage = (event) => this._emit('message', event);
    source.onerror = () => {
      this._emit('error', new Error('EventSource failed'));
      this._scheduleReconnect();
    };

    source.addEventListener('notification', (event) => this._emit('notification', event));
    source.addEventListener('gig_submitted', (event) => this._emit('gig_submitted', event));
    source.addEventListener('gig_pending', (event) => this._emit('gig_pending', event));
    source.addEventListener('gig_approved', (event) => this._emit('gig_approved', event));
    source.addEventListener('gig_rejected', (event) => this._emit('gig_rejected', event));
    source.addEventListener('gig_updated', (event) => this._emit('gig_updated', event));
    source.addEventListener('metrics_changed', (event) => this._emit('metrics_changed', event));
    source.addEventListener('heartbeat', (event) => this._emit('heartbeat', event));
  }

  _scheduleReconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    setTimeout(() => this.connect(), this.retryDelayMs);
  }

  on(eventName, handler) {
    const listeners = this.listeners.get(eventName) || new Set();
    listeners.add(handler);
    this.listeners.set(eventName, listeners);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    const listeners = this.listeners.get(eventName);
    if (!listeners) return;
    listeners.delete(handler);
    if (listeners.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
  }

  _emit(eventName, event) {
    const listeners = this.listeners.get(eventName);
    if (!listeners || listeners.size === 0) return;
    let parsed;
    try {
      parsed = event && event.data ? JSON.parse(event.data) : {};
    } catch (err) {
      parsed = { raw: event.data };
    }
    for (const handler of listeners) {
      handler(parsed, event);
    }
  }
}

export function createEventStreamClient(endpoint) {
  const client = new EventStreamClient(endpoint);
  client.connect();
  return client;
}

let sharedClient;

export function getSharedEventStream(endpoint) {
  if (sharedClient) {
    return sharedClient;
  }
  sharedClient = createEventStreamClient(endpoint);
  return sharedClient;
}