import axios from "axios";

const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api",
  withCredentials: true,
});

console.log("API URL:", import.meta.env.VITE_API_URL);
console.log("Base URL:", axiosInstance.defaults.baseURL);

export default axiosInstance;