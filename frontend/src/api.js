const API = (import.meta.env.VITE_API_URL || "http://localhost:10000").replace(/\/$/, "");
export default API;
