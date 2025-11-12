import { collection, getDocs, getDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { firestore } from './firebaseConfig';

// Map Firestore gig document to frontend shape
function mapGigDoc(d) {
  const data = d.data();
  return {
    id: d.id,
    title: data.title,
    description: data.description,
    providerName: data.providerName || data.provider || 'Unknown',
    category: data.category || data.type || 'general',
    price: data.price || 0,
    duration: data.duration || '',
    rating: data.rating || 0,
    applicantsCount: data.applicantsCount || 0,
    skillsRequired: data.skillsRequired || [],
    // include raw data so screens can access additional fields if needed
    _raw: data,
  };
}

export async function fetchGigs({ category, search } = {}) {
  const col = collection(firestore, 'gigs');
  let q = query(col, orderBy('createdAt', 'desc'));
  if (category && category !== 'all') {
    q = query(col, where('category', '==', category));
  }
  const snap = await getDocs(q);
  let data = snap.docs.map(mapGigDoc);
  if (search) {
    const s = search.toLowerCase();
    data = data.filter(g => (g.title + ' ' + g.description).toLowerCase().includes(s));
  }
  return data;
}

export async function fetchGigById(gigId) {
  const d = await getDoc(doc(firestore, 'gigs', gigId));
  if (!d.exists()) return null;
  return mapGigDoc(d);
}

export async function fetchUserProfile(uid) {
  const d = await getDoc(doc(firestore, 'users', uid));
  if (!d.exists()) return null;
  const data = d.data();
  return {
    uid: d.id,
    name: data.name,
    email: data.email,
    role: data.role,
    avatar: data.avatar || null,
    stats: data.stats || { applications: 0, accepted: 0, completed: 0 },
    skills: data.skills || [],
    _raw: data,
  };
}

export async function fetchGigsByProvider(providerUid) {
  const col = collection(firestore, 'gigs');
  const q = query(col, where('providerUid', '==', providerUid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(mapGigDoc);
}

export async function fetchPendingGigs() {
  const col = collection(firestore, 'gigs');
  const q = query(col, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(mapGigDoc);
}

export async function fetchApplicationsByProvider(providerUid, status = null) {
  const col = collection(firestore, 'applications');
  let q = query(col, where('providerUid', '==', providerUid));
  if (status) q = query(q, where('status', '==', status));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchRatingsForProvider(providerUid) {
  const col = collection(firestore, 'ratings');
  const q = query(col, where('providerUid', '==', providerUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

export default {
  fetchGigs,
  fetchGigById,
  fetchUserProfile,
};
