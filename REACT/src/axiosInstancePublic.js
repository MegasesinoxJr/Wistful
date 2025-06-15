import axios from 'axios';

export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;
export const WS_SERVER_BASE_URL = import.meta.env.VITE_WS_SERVER_BASE_URL;
export const DEBUG = import.meta.env.VITE_DEBUG;
const axiosInstancePublic = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL + "/api/",
  withCredentials: true,
});

// No interceptors, no token, no refresh

export default axiosInstancePublic;
