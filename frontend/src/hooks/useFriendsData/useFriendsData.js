import { useState, useEffect, useCallback } from 'react';

export default function useFriendsData() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    Promise.all([
      fetch('/api/friends', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
      fetch('/api/friends/requests', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.ok ? res.json() : [])
    ])
      .then(([friendsData, requestsData]) => {
        // Extract array if nested, or fall back safely to an empty array
        const pureFriendsArray = Array.isArray(friendsData) 
          ? friendsData 
          : (friendsData?.friends || friendsData?.data || []);

        const pureRequestsArray = Array.isArray(requestsData) 
          ? requestsData 
          : (requestsData?.requests || requestsData?.data || []);

        const sortedFriends = [...pureFriendsArray].sort((a, b) => 
          (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '')
        );

        setFriends(sortedFriends);
        setRequests(pureRequestsArray);
      })
      .catch(err => console.error("Error synchronizing relationship models:", err))
      .finally(() => setLoading(false));
  }, [token]);


  const processRequest = useCallback(async (requestId, targetFriend, actionType) => {
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: actionType })
      });

      if (res.ok) {
        setRequests(prev => prev.filter(req => req.id !== requestId));
        if (actionType === 'ACCEPTED') {
          setFriends(prev => {
            const updated = [...prev, targetFriend];
            return updated.sort((a, b) => 
              (a.displayName || a.username).localeCompare(b.displayName || b.username)
            );
          });
        }
      }
    } catch (err) {
      console.error("Failed to mutate relationship model status:", err);
    }
  }, [token]);

  return { friends, requests, loading, processRequest };
}
