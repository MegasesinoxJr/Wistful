import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL + "/api/",
  withCredentials: true,
});

// 👉 Interceptor de request: añade el token automáticamente desde localStorage
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 👉 Interceptor de response: intenta refrescar el token, o cierra sesión si falla
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Si el access token expiró, intenta refrescarlo
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axiosInstance.post('token/refresh/');
        const newAccessToken = refreshResponse.data.access;

        localStorage.setItem('access_token', newAccessToken);

        return axiosInstance(originalRequest); // vuelve a intentar la request original
      } catch (err) {
        console.error("Error al refrescar el token:", err);

        // 👉 Aquí va el cierre de sesión:
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");         // o como hayas guardado la info del usuario

        // 👉 Fuerza redirección al login
        window.location.href = "/login";         // ajusta si tu ruta de login es distinta

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
