import axios from 'axios';
import { langFromPath } from "../i18n";

// export const API_URL = "http://localhost:3000";

export const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Sunucu hata mesajlarını, içeriği ve mailleri sayfanın dilinde üretsin.
// Dil adresten okunur: admin paneli (/admin, öneksiz) her zaman Türkçe ister.
api.interceptors.request.use((config) => {
  config.headers.set("Accept-Language", langFromPath(window.location.pathname));
  return config;
});

export default api;

