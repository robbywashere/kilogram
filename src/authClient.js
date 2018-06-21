// in src/authClient.js
import { AUTH_CHECK, AUTH_LOGIN, AUTH_ERROR, AUTH_LOGOUT } from 'admin-on-rest';
import axios from 'axios'; // TODO: NO!
import { fetchJson } from 'admin-on-rest/lib/util/fetch';

export const sessionClient = (type, params) => {
  if (type === AUTH_LOGIN) {
    const { username, password } = params;
    return axios.post('/auth', { username, password }, { withCredentials: true });
  }
  if (type === AUTH_ERROR) {
    const { status } = params;
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
  }
  if (type === AUTH_CHECK) {
    return axios.get('/auth');
  }
  if (type === AUTH_LOGOUT) {
    // MUST NOT RETURN axios.delete, a reject will fail the logout on the client-side code, 
    // meaning to login redirect screen, meaning an endless loop 
    return axios.delete('/auth').catch(()=>{});
  }
  return Promise.resolve();
};

export const jwtAuthClient = async (type, params) => {
  if (type === AUTH_LOGIN) {
    const { username, password } = params;
    const { token } = await axios.post('/auth', { username, password });
    localStorage.setItem('token', token);
  }
  if (type === AUTH_ERROR) {
    const { status } = params;
    if (status === 401 || status === 403) {
      throw new Error('AUTH_ERROR');
    }
  }
  if (type === AUTH_CHECK) {
    if (localStorage.getItem('token')) return;
    throw new Error('AUTH_CHECK');
  }
  if (type === AUTH_LOGOUT) {
    return axios.delete('/auth');
  }
};

export const httpClient = (url, options = {}) => {
  const token = localStorage.getItem('token');
  if (token) options.headers.set('Authorization', `Bearer ${token}`);
  fetchJson(url, { ...options, credentials: 'include' });
};

