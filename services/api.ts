import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const api = axios.create({
  baseURL: 'https://optica-zeus-backend.fly.dev',
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});