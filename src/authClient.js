// in src/authClient.js
import { AUTH_LOGIN, AUTH_ERROR, AUTH_LOGOUT } from 'admin-on-rest';
import axios from 'axios'; //TODO: NO!

export default (type, params) => {
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
  if (type === AUTH_LOGOUT) {
    return axios.delete('/auth');
  }
  return Promise.resolve();
}

