import styles from './ProfileEditForm.module.css';
import parentStyles from '../../../pages/ProfilePage/ProfilePage.module.css';

const AVAILABLE_THEMES = ['SLATE', 'EMERALD', 'OCEAN', 'AMETHYST', 'ROSE'];

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Harley', 'Buster', 'Kiki', 'Casper', 'Socks', 'Spooky', 'Mittens'];

export default function ProfileEditForm({ formData, onChange, onSave, onCancel }) {
  
  const setField = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const activeSeed = (() => {
    if (!formData.avatarUrl) return 'Felix';
    try {
      const urlObj = new URL(formData.avatarUrl);
      return urlObj.searchParams.get('seed') || 'Felix';
    } catch {
      if (formData.avatarUrl.includes('seed=')) {
        return formData.avatarUrl.split('seed=')[1] || 'Felix';
      }
      return 'Felix';
    }
  })();

  const handleSelectAvatar = (seed) => {
    const nextAvatarUrl = `https://api.dicebear.com/10.x/glyphs/svg?seed=${seed}`;
    setField('avatarUrl', nextAvatarUrl);
  };

  return (
    <div className={styles.form}>
      {/* Avatar Picker Choice Container Component Section Grid */}
      <div className={styles.avatarSection}>
        <label className={styles.gridLabel}>Select Avatar Icon</label>
        <div className={styles.avatarGrid}>
          {AVATAR_SEEDS.map((seed) => {
            const previewUrl = `https://api.dicebear.com/10.x/glyphs/svg?seed=${seed}`;
            const isSelected = activeSeed === seed;

            return (
              <button
                key={seed}
                type="button"
                onClick={() => handleSelectAvatar(seed)}
                className={`${styles.avatarTile} ${isSelected ? styles.avatarTileActive : ''}`}
                aria-label={`Select avatar variant ${seed}`}
              >
                <img src={previewUrl} alt="" className={styles.avatarTileImg} />
              </button>
            );
          })}
        </div>
      </div>

      <label htmlFor="edit-display-name">Display Name</label>
      <input 
        id="edit-display-name" 
        type="text" 
        value={formData.displayName} 
        onChange={(e) => setField('displayName', e.target.value)} 
      />

      <label htmlFor="edit-bio">Bio</label>
      <textarea 
        id="edit-bio" 
        value={formData.bio} 
        onChange={(e) => setField('bio', e.target.value)} 
      />

      <label htmlFor="edit-theme">Theme Preference</label>
      <select 
        id="edit-theme" 
        value={formData.themePreference} 
        onChange={(e) => setField('themePreference', e.target.value)} 
      >
        {AVAILABLE_THEMES.map((theme) => (
          <option key={theme} value={theme}>{theme}</option>
        ))}
      </select>

      <div className={parentStyles.actions}>
        <button onClick={onSave} className={parentStyles.btnSave}>Save</button>
        <button onClick={onCancel} className={parentStyles.btnCancel}>Cancel</button>
      </div>
    </div>
  );
}
