import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import ProfileCard from '../../components/profile/ProfileCard/ProfileCard';
import ProfileEditForm from '../../components/profile/ProfileEditForm/ProfileEditForm';
import styles from './ProfilePage.module.css';

export default function ProfilePage({ currentUser, onGlobalThemeChange }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const isSelf = !username || username === currentUser.username;

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ displayName: '', bio: '', themePreference: 'SLATE' });

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
        setFormData({
          displayName: rawUserObj.displayName || '',
          bio: rawUserObj.bio || '',
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

  const handleInitiateDM = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usernames: [profile.username] })
    });
    
    if (res.ok) {
      const conv = await res.json();
      navigate(`/conversations/${conv.data.id}`);
    }
  };

  if (loading) return <div className={styles.loading}>Loading profile...</div>;

  return (
    <div className={styles.container} data-theme={profile?.themePreference}>
      <div className={styles.card}>
        <img 
          src={profile?.avatarUrl || `https://api.dicebear.com/10.x/glyphs/svg`} 
          alt="Avatar" 
          className={styles.avatar} 
        />
        <div className={styles.infoBlock}>
          {isEditing ? (
            <ProfileEditForm 
              formData={formData}
              onChange={setFormData}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <ProfileCard 
              profile={profile}
              isSelf={isSelf}
              onEditClick={handleStartEditing}
              onMessageClick={handleInitiateDM}
            />
          )}
        </div>
      </div>
    </div>
  );
}
