import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // or your backend URL
  withCredentials: true, // if cookies are used
});

export default api;
