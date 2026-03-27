import axios from "axios";

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

let authRequestInterceptorId = null;

export const setupAxiosAuthInterceptor = (getToken) => {
  if (authRequestInterceptorId !== null) {
    axiosInstance.interceptors.request.eject(authRequestInterceptorId);
  }

  authRequestInterceptorId = axiosInstance.interceptors.request.use(async (config) => {
    const token = await getToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return authRequestInterceptorId;
};

export const clearAxiosAuthInterceptor = () => {
  if (authRequestInterceptorId !== null) {
    axiosInstance.interceptors.request.eject(authRequestInterceptorId);
    authRequestInterceptorId = null;
  }
};

export default axiosInstance;