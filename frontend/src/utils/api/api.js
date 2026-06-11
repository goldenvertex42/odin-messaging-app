const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function customFetch(endpoint, options = {}) {
  const fullUrl = endpoint.startsWith('/') 
    ? `${API_BASE_URL}${endpoint}` 
    : `${API_BASE_URL}/${endpoint}`;

  // 1. Automatically extract the current active session token
  const token = localStorage.getItem('token');

  // 2. Safely initialize and copy existing headers array properties
  const headers = new Headers(options.headers || {});

  // 3. Force the token header to append on all environments
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Set content type automatically if passing objects
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const updatedOptions = {
    ...options,
    headers
  };

  const response = await fetch(fullUrl, updatedOptions);
  
  const text = await response.text();
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const parsedData = isJson && text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(parsedData?.message || `API Error: ${response.statusText || response.status}`);
  }

  return {
    ...response,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    json: async () => parsedData,
    text: async () => text
  };
}
