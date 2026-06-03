import { useNavigate } from 'react-router';
import styles from './ActiveFriendGrid.module.css';

export default function ActiveFriendsGrid({ friends }) {
  const navigate = useNavigate();

  return (
    <main className={styles.mainList}>
      <h3>Your Friends ({friends.length})</h3>
      {friends.length === 0 ? (
        <p className={styles.empty}>Your friends list is empty.</p>
      ) : (
        <div className={styles.grid}>
          {friends.map(friend => (
            <div 
              key={friend.id} 
              className={styles.friendCard}
              onClick={() => navigate(`/profile/${friend.username}`)}
            >
              <img src={friend.avatarUrl} alt="" />
              <h4>{friend.displayName || friend.username}</h4>
              <p>@{friend.username}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
