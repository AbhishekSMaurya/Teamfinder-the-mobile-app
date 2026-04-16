// src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Base URL — update to your machine's local IP ──────────────────────────
const BASE_URL = 'http://192.168.1.9:8000/api';

// ── Token helpers ─────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess:  () => AsyncStorage.getItem('access_token'),
  getRefresh: () => AsyncStorage.getItem('refresh_token'),
  setTokens:  (access, refresh) =>
    Promise.all([
      AsyncStorage.setItem('access_token', access),
      AsyncStorage.setItem('refresh_token', refresh),
    ]),
  clear: () =>
    Promise.all([
      AsyncStorage.removeItem('access_token'),
      AsyncStorage.removeItem('refresh_token'),
    ]),
};

// ── Response handler ──────────────────────────────────────────────────────
const handleResponse = async (response) => {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body.detail) {
        message = body.detail;
      } else if (body.non_field_errors) {
        message = body.non_field_errors[0];
      } else {
        const firstKey = Object.keys(body)[0];
        if (firstKey) {
          const val = body[firstKey];
          message = Array.isArray(val) ? val[0] : String(val);
        }
      }
    } catch (_) {}
    throw new Error(message);
  }
  return response.json();
};

// ── Auth headers ──────────────────────────────────────────────────────────
const authHeaders = async () => {
  const token = await tokenStorage.getAccess();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── API ───────────────────────────────────────────────────────────────────
const api = {

  // ── Auth ────────────────────────────────────────────────────────────────

  login: async (username, password) => {
    const response = await fetch(`${BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });
    const data = await handleResponse(response);
    await tokenStorage.setTokens(data.access, data.refresh);
    return data;
  },

  register: async (payload) => {
    const response = await fetch(`${BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response);
    await tokenStorage.setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  },

  getMeWithToken: async (accessToken) => {
    const response = await fetch(`${BASE_URL}/auth/me/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return handleResponse(response);
  },

  getMe: async () => {
    const response = await fetch(`${BASE_URL}/auth/me/`, {
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },

  logout: async () => {
    try {
      const refresh = await tokenStorage.getRefresh();
      if (refresh) {
        await fetch(`${BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({ refresh }),
        });
      }
    } catch (_) {}
    finally {
      await tokenStorage.clear();
    }
  },

  // ── Announcements ────────────────────────────────────────────────────────

  getAnnouncements: async (page = 1) => {
    const response = await fetch(`${BASE_URL}/announcements/?page=${page}`, {
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },

  createAnnouncement: async (payload) => {
    const response = await fetch(`${BASE_URL}/announcements/`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  // ── Posts ────────────────────────────────────────────────────────────────

  getPosts: async (page = 1) => {
    const response = await fetch(`${BASE_URL}/posts/?page=${page}`, {
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },

  getMyPosts: async () => {
    const response = await fetch(`${BASE_URL}/posts/mine/`, {
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },

  createPost: async (payload) => {
    const response = await fetch(`${BASE_URL}/posts/`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  likePost: async (postId) => {
    const response = await fetch(`${BASE_URL}/posts/${postId}/like/`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },

  // ── Projects ─────────────────────────────────────────────────────────────

  getMyProjects: async () => {
    const response = await fetch(`${BASE_URL}/projects/my/`, {
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },

  getAllProjects: async () => {
    const response = await fetch(`${BASE_URL}/projects/`, {
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },

  createProject: async (payload) => {
    const response = await fetch(`${BASE_URL}/projects/`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  // ── Teams ─────────────────────────────────────────────────────────────────

  getMyTeams: async () => {
    const response = await fetch(`${BASE_URL}/teams/my/`, {
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },

  getTeams: async () => {
    const response = await fetch(`${BASE_URL}/teams/`, {
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },

  createTeam: async (payload) => {
    const response = await fetch(`${BASE_URL}/teams/`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  joinTeam: async (teamId) => {
    const response = await fetch(`${BASE_URL}/teams/${teamId}/join/`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    return handleResponse(response);
  },
};

export default api;
