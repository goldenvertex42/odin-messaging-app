import { useState } from 'react';
import { Link } from 'react-router';
import styles from './ProfileCard.module.css';
import parentStyles from '../../../pages/ProfilePage/ProfilePage.module.css';

export default function ProfileCard({ 
  profile, 
  isSelf, 
  onEditClick, 
  onMessageClick,
  onAddFriendClick,
  relationshipStatus
}) {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(relationshipStatus || 'NONE');

  const handleAddFriend = async () => {
    if (!onAddFriendClick) return;
    setLoading(true);
    try {
      await onAddFriendClick(profile.id);
      setLocalStatus('PENDING'); // Instantly update look on success
    } catch (error) {
      console.error("Failed to send friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.view}>
      <h2>{profile?.displayName || profile?.username}</h2>
      <p className={styles.handle}>@{profile?.username}</p>
      <p className={styles.bio}>{profile?.bio || "No bio written yet."}</p>
      
      <div className={parentStyles.actions}>
        {isSelf ? (
          <button onClick={onEditClick} className={parentStyles.btnEdit}>
            Edit Profile
          </button>
        ) : (
          <>
            {/* Contextual Action: Add Friend / Pending Label */}
            {localStatus === 'NONE' && (
              <button 
                onClick={handleAddFriend} 
                disabled={loading}
                className={parentStyles.btnAddFriend}
              >
                {loading ? 'Sending...' : 'Add Friend'}
              </button>
            )}

            {localStatus === 'PENDING' && (
              <button disabled className={parentStyles.btnPending}>
                Request Pending
              </button>
            )}

            {/* Direct message remains accessible for non-blocked connections */}
            <button onClick={onMessageClick} className={parentStyles.btnMessage}>
              Send Message
            </button>
          </>
        )}
        <Link to="/" className={parentStyles.navLink}>Back to Home</Link>
      </div>
    </div>
  );
}

