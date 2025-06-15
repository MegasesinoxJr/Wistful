import axios from 'axios';

const axiosInstanceInsignias = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL + "/insignias/",
  withCredentials: true,
});

// 1️⃣ Request interceptor: añade el access token si existe
axiosInstanceInsignias.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2️⃣ Response interceptor: refresca y reintenta con ESTA misma instancia
axiosInstanceInsignias.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // pedimos refresh usando la instancia normal (que apunta a /api/)
        const { data } = await axios.post(
          import.meta.env.VITE_SERVER_BASE_URL + "/api/token/refresh/",
          {},
          { withCredentials: true }
        );
        const newAccessToken = data.access;
        localStorage.setItem('access_token', newAccessToken);

        // actualizamos la cabecera de esta misma instancia
        axiosInstanceInsignias.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // reintentamos con axiosInstanceInsignias
        return axiosInstanceInsignias(originalRequest);
      } catch (e) {
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstanceInsignias;
