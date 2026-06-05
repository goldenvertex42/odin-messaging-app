import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useUserSearch } from '../../../hooks/useUserSearch/useUserSearch';
import styles from './FriendSearch.module.css';

export default function FriendSearch() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const { suggestions, isSearching } = useUserSearch(searchInput);

  const hasSearched = searchInput.trim().length > 0;

  return (
    <header className={styles.searchHeader}>
      <input 
        type="text" 
        placeholder="Search global users by username..." 
        value={searchInput} 
        onChange={(e) => setSearchInput(e.target.value)} 
        className={styles.searchInput} 
      />
      <Link to="/" className={styles.navLink}>Back to Home</Link>

      {hasSearched && (
        <div className={styles.suggestionsDropdown}>
          {isSearching && <div className={styles.statusMsg}>Searching...</div>}
          
          {!isSearching && suggestions.length === 0 && (
            <div className={styles.noResultsMsg}>No results - User does not exist</div>
          )}

          {!isSearching && suggestions.map((user) => (
            <div 
              key={user.id || user.username} 
              className={styles.suggestionRow} 
              onClick={() => navigate(`/profile/${user.username}`)}
            >
              <img src={user.avatarUrl} alt="" />
              <div>
                <span className={styles.name}>{user.displayName || user.username}</span>
                <span className={styles.handle}>@{user.username}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
