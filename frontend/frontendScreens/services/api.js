import api from '../../services/api';

const unwrapItems = (data) => {
	if (!data) {
		return [];
	}
	if (Array.isArray(data)) {
		return data;
	}
	if (data.items && Array.isArray(data.items)) {
		return data.items;
	}
	return data;
};

export const loginUser = async (email, password, role) => {
	const response = await api.post('/auth/login', { email, password, role });
	return response.data;
};

export const registerUser = async (userData) => {
	const response = await api.post('/auth/signup', userData);
	return response.data;
};

export const fetchGigs = async () => {
	const response = await api.get('/gigs');
	return unwrapItems(response.data);
};

export const fetchRoutes = async () => {
	const response = await api.get('/routes');
	return response.data;
};

export const fetchLocations = async () => {
	const response = await api.get('/locations');
	return response.data;
};

export const applyToGig = async (gigId, applicationData = {}) => {
	const payload = { gig_id: gigId };

	if (applicationData && typeof applicationData === 'object') {
		Object.entries(applicationData).forEach(([key, value]) => {
			if (value === undefined || value === null) {
				return;
			}

			if (typeof value === 'string') {
				const trimmed = value.trim();
				if (trimmed.length === 0) {
					return;
				}
				payload[key] = trimmed;
				return;
			}

			payload[key] = value;
		});
	}

	const response = await api.post('/applications', payload);
	return response.data;
};

export const studentApi = {
	getMyApplications: (params) => api.get('/applications/my-applications', { params }).then((r) => r.data),
	getProfile: () => api.get('/users/profile').then((r) => r.data),
};

export const fetchGigById = async (gigId) => {
	const response = await api.get(`/gigs/${gigId}`);
	return response.data;
};

export const saveGig = async (gigId) => {
	const response = await api.post('/users/saved-gigs', { gig_id: gigId });
	return response.data;
};

export const fetchSavedGigs = async () => {
	const response = await api.get('/users/saved-gigs');
	return response.data;
};

export const fetchCurrentProfile = async () => {
	const response = await api.get('/users/profile');
	return response.data;
};

export const sendMessage = async (threadId, senderId, text) => {
	const response = await api.post(`/messages/${threadId}`, { senderId, text });
	return response.data;
};

export const fetchMessages = async (threadId) => {
	const response = await api.get(`/messages/${threadId}`);
	return response.data;
};

export const fetchUserProfile = async (userId) => {
	const response = await api.get(`/users/${userId}`);
	return response.data;
};

export const updateUserProfile = async (userId, updates) => {
	const response = await api.put(`/users/${userId}`, updates);
	return response.data;
};

const providerApiBase = {
	getGigs: (params) => api.get('/gigs/my-gigs', { params }).then((r) => r.data),
	createGig: (data) => api.post('/gigs', data).then((r) => r.data),
	updateGig: (gigId, data) => api.put(`/gigs/${gigId}`, data).then((r) => r.data),
	deleteGig: (gigId) => api.delete(`/gigs/${gigId}`).then((r) => r.data),
	getApplicationsForGig: (gigId) => api.get(`/gigs/${gigId}/applications`).then((r) => r.data),
};

export const providerApi = {
	...providerApiBase,
	selectApplication: (applicationId) => api.patch(`/applications/${applicationId}/select`).then((r) => r.data),
	rejectApplication: (applicationId) => api.patch(`/applications/${applicationId}/reject`).then((r) => r.data),
};

export default api;