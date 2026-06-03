import useFriendsData from '../../hooks/useFriendsData/useFriendsData';
import FriendSearch from '../../components/friends/FriendSearch/FriendSearch';
import PendingRequests from '../../components/friends/PendingRequests/PendingRequests';
import ActiveFriendGrid from '../../components/friends/ActiveFriendGrid/ActiveFriendGrid';
import styles from './FriendsListPage.module.css';

export default function FriendsListPage() {
  const { friends, requests, loading, processRequest } = useFriendsData();

  if (loading) return <div className={styles.statusMsg}>Synchronizing network models...</div>;

  return (
    <div className={styles.friendsContainer}>
      <FriendSearch />
      
      <div className={styles.workspaceSplit}>
        <PendingRequests requests={requests} onDecision={processRequest} />
        <ActiveFriendGrid friends={friends} />
      </div>
    </div>
  );
}
