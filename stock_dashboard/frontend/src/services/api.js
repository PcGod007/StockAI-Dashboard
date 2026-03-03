import axios from 'axios';

// In dev: Vite proxy forwards /api → Flask (see vite.config.js)
// In production: set VITE_API_URL to your deployed backend (e.g. Render.com)
// Compute base URL using environment variable; the variable must be set to the
// Railway domain (without a trailing `/api`).
// If it isn't set, the code will fall back to `/api`, which only works in
// development when the Vite proxy is active.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api` // strip any trailing slashes
  : '/api';

// helpful debug output in the browser console so you can verify which URL is
// being used when the app runs on Netlify
console.log('API BASE:', BASE);

export const fetchStockData = (ticker, start, end) =>
  axios.get(`${BASE}/stock-data`, { params: { ticker, start, end } }).then(r => r.data);

export const fetchMovingAverage = (ticker, start, end, windows) =>
  axios.get(`${BASE}/moving-average`, { params: { ticker, start, end, windows: windows.join(',') } }).then(r => r.data);

export const fetchPrediction = (ticker, start, end) =>
  axios.get(`${BASE}/predict`, { params: { ticker, start, end } }).then(r => r.data);

export const fetchNews = (ticker) =>
  axios.get(`${BASE}/news`, { params: { ticker } }).then(r => r.data);
