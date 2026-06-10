const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function customFetch(endpoint, options = {}) {
  const fullUrl = endpoint.startsWith('/') 
    ? `${API_BASE_URL}${endpoint}` 
    : `${API_BASE_URL}/${endpoint}`;

  const response = await fetch(fullUrl, options);
  
  // 🏆 Parse the JSON payload first so we don't lose custom error messages
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // If the server sent a custom error message, use it; otherwise fall back to statusText
    throw new Error(data?.message || `API Error: ${response.statusText || response.status}`);
  }
  
  return data;
}
