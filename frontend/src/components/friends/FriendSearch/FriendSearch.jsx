import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import styles from './FriendSearch.module.css';

export default function FriendSearch() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    const token = localStorage.getItem('token');

    const delayDebounce = setTimeout(() => {
      fetch(`/api/users/profile/${searchInput.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(user => {
          setSearchResults([user]);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  return (
    <header className={styles.searchHeader}>
      <input
        type="text"
        placeholder="Search global users by username..."
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        className={styles.searchInput}
      />
      <Link to="/" className={styles.navLink}>Back to Home</Link>
  
      {hasSearched && (
        <div className={styles.suggestionsDropdown}>
          {isSearching && <div className={styles.statusMsg}>Searching...</div>}
          {!isSearching && searchResults.length === 0 && (
            <div className={styles.noResultsMsg}>No results - User does not exist</div>
          )}
          {!isSearching && searchResults.map(user => (
            <div 
              key={user.id} 
              className={styles.suggestionRow}
              onClick={() => navigate(`/profile/${user.username}`)}
            >
              <img src={user.avatarUrl || `https://dicebear.com{user.username}`} alt="" />
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
