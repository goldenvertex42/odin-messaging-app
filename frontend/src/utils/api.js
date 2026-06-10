const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function customFetch(endpoint, options = {}) {
  // Automatically stitch your base domain URL onto the request path
  const fullUrl = endpoint.startsWith('/') 
    ? `${API_BASE_URL}${endpoint}` 
    : `${API_BASE_URL}/${endpoint}`;

  const response = await fetch(fullUrl, options);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}
