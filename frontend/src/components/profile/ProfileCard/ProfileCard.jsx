import styles from './ProfileCard.module.css';
import parentStyles from '../../../pages/ProfilePage/ProfilePage.module.css';


export default function ProfileCard({ profile, isSelf, onEditClick, onMessageClick }) {
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
          <button onClick={onMessageClick} className={parentStyles.btnMessage}>
            Send Message
          </button>
        )}
      </div>
    </div>
  );
}
