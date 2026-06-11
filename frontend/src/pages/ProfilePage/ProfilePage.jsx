import { useParams, useNavigate } from 'react-router';
import { useProfileSession } from '../../hooks/useProfileSession/useProfileSession';
import { customFetch } from '../../utils/api/api';
import ProfileCard from '../../components/profile/ProfileCard/ProfileCard';
import ProfileEditForm from '../../components/profile/ProfileEditForm/ProfileEditForm';
import styles from './ProfilePage.module.css';

export default function ProfilePage({ currentUser, onGlobalThemeChange }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const isSelf = !username || username === currentUser.username;

  // Destructure hook mechanics cleanly
  const {
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
  } = useProfileSession(username, isSelf, currentUser, onGlobalThemeChange);

  const handleInitiateDM = async () => {
    const token = localStorage.getItem('token');
    const res = await customFetch('/api/conversations', {
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
          src={profile?.avatarUrl} 
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
              onAddFriendClick={handleSendFriendRequest}
              relationshipStatus={relationshipStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}
