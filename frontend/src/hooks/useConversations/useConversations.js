import { useState, useEffect, useCallback } from 'react';

export function useConversations(getToken) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. MEMOIZED SYNC METHOD
  const fetchConversations = useCallback(async () => {
    const token = getToken ? getToken() : localStorage.getItem('token');
    if (!token) {
      setError('Authentication token missing.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid database layout format.');
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to retrieve active chat channels.');
      }

      setConversations(result.data || []);
    } catch (err) {
      console.error('Conversations channel synchronization failure:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 2. UNIFIED CONTEXT ACTION HANDLER
  // Connects directly to NewChatModal by accepting an array of participant usernames
  const createConversation = useCallback(async (usernames, groupName = null) => {
    const token = getToken ? getToken() : localStorage.getItem('token');
    if (!token) throw new Error('Authentication token missing.');
    if (!usernames || usernames.length === 0) throw new Error('No recipients specified.');

    // Determine type context dynamically by array size bounds
    const isGroup = usernames.length > 1;

    try {
      const response = await fetch(`/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isGroup,
          usernames,
          name: isGroup ? (groupName || `Group with ${usernames.slice(0, 2).join(', ')}...`) : `Chat with ${usernames[0]}`
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to initialize conversation thread.');
      }

      // Re-hydrate local channel list layout state tracking seamlessly
      await fetchConversations();
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [getToken, fetchConversations]);

  return {
    conversations,
    setConversations,
    loading,
    error,
    refreshConversations: fetchConversations,
    createConversation
  };
}
