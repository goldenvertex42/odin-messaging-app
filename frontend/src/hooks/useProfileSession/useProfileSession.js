import { useState, useEffect } from 'react';

export function useProfileSession(username, isSelf, currentUser, onGlobalThemeChange) {
  const [profile, setProfile] = useState(null);
  const [relationshipStatus, setRelationshipStatus] = useState('NONE');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ displayName: '', bio: '', themePreference: 'SLATE' });

  // Lifecycle: Hydrate workspace profile
  useEffect(() => {
    const targetUser = isSelf ? currentUser?.username : username;
    if (!targetUser) return;

    setLoading(true);
    const token = localStorage.getItem('token');
    
    fetch(`/api/profile/${targetUser}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((responsePayload) => {
        const rawUserObj = responsePayload.data || responsePayload;
        setProfile(rawUserObj);
        setRelationshipStatus(rawUserObj.relationshipStatus || 'NONE');
        setFormData({
          displayName: rawUserObj.displayName || '',
          bio: rawUserObj.bio || '',
          avatarUrl: rawUserObj.avatarUrl || '', 
          themePreference: rawUserObj.themePreference || 'SLATE'
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profile payload crash:", err);
        setLoading(false);
      });
  }, [username, isSelf, currentUser]);

  const handleStartEditing = () => {
    if (profile) {
      setFormData({
        displayName: profile?.displayName || profile?.username || '',
        bio: profile?.bio || '',
        themePreference: profile?.themePreference || 'SLATE'
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const responsePayload = await res.json();
        const updatedProfile = responsePayload.data || responsePayload;
        setProfile(updatedProfile);
        setIsEditing(false);
        if (isSelf && updatedProfile?.themePreference) {
          onGlobalThemeChange(updatedProfile.themePreference);
        }
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const handleSendFriendRequest = async (receiverId) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/friends/requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ receiverId })
    });

    if (!res.ok) {
      const errorPayload = await res.json();
      throw new Error(errorPayload.error || "Failed to transmit request record.");
    }

    const payload = await res.json();
    console.log("Friend request sent successfully:", payload);
    setRelationshipStatus('PENDING');
    return payload;
  };

  return {
    profile,
    relationshipStatus,
    isEditing,
    loading,
    formData,
    setFormData,
    handleStartEditing,
    handleSave,
    setIsEditing,
    handleSendFriendRequest
  };
}
