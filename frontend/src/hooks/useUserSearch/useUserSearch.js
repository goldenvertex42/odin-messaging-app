import { useState, useEffect } from 'react';
import { customFetch } from '../../utils/api';

/**
 * Custom hook to execute a debounced global user search against the Prisma user matrix
 * @param {string} searchInput - Raw text input value from the search form input
 * @returns {Object} { suggestions, isSearching }
 */
export function useUserSearch(searchInput) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const query = searchInput.trim();
    if (!query) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const token = localStorage.getItem('token');

    const delayDebounce = setTimeout(() => {
      customFetch(`/api/profile/search?query=${query}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then((res) => {
          if (!res.ok) throw new Error('Query error');
          return res.json();
        })
        .then((responsePayload) => {
          const rawDataArray = responsePayload.data || responsePayload;

          if (Array.isArray(rawDataArray)) {
            setSuggestions(rawDataArray);
          } else if (rawDataArray && typeof rawDataArray === 'object') {
            setSuggestions([rawDataArray]);
          } else {
            setSuggestions([]);
          }
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  return { suggestions, isSearching };
}
