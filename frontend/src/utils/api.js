const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function customFetch(endpoint, options = {}) {
  const fullUrl = endpoint.startsWith('/') 
    ? `${API_BASE_URL}${endpoint}` 
    : `${API_BASE_URL}/${endpoint}`;

  // 1. Execute the absolute production network request
  const response = await fetch(fullUrl, options);
  
  // 2. Safely parse the text/json payload out of the stream
  const text = await response.text();
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const parsedData = isJson && text ? JSON.parse(text) : null;

  // 3. Handle server-side errors while preserving descriptive error messages
  if (!response.ok) {
    throw new Error(parsedData?.message || `API Error: ${response.statusText || response.status}`);
  }

  // 4. 🏆 Re-wrap the parsed data into a valid, standard Web API Response clone
  return {
    ...response,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers, // Keeps .headers.get() fully functional!
    json: async () => parsedData,
    text: async () => text
  };
}
