import { useState, useEffect } from 'react';

export function useFriendSearch(isOpen, usernameInput, participants = []) {
  const [friends, setFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Fetch friends list once when modal opens
  useEffect(() => {
    if (!isOpen) {
      setFriends([]);
      return;
    }

    const fetchFriendsList = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/friends`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setFriends(result.data || []);
        }
      } catch (err) {
        console.error('Failed to load friend suggestions:', err);
      }
    };

    fetchFriendsList();
  }, [isOpen]);

  // Filter list dynamically based on search text and selected chips
  useEffect(() => {
    const searchTerm = usernameInput.trim().toLowerCase();
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }

    const filtered = friends.filter(friend => 
      friend.username.toLowerCase().includes(searchTerm) &&
      !participants.includes(friend.username)
    );
    setSuggestions(filtered);
    
    // 🎯 SAFE DEP GUARD: Stringify the participants array to watch changes to its values
    // instead of watching its unstable array memory references
  }, [usernameInput, friends, JSON.stringify(participants)]);

  return { suggestions };
}
