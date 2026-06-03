import styles from './ProfileEditForm.module.css';
import parentStyles from '../../../pages/ProfilePage/ProfilePage.module.css';

const AVAILABLE_THEMES = ['SLATE', 'EMERALD', 'OCEAN', 'AMETHYST', 'ROSE'];

export default function ProfileEditForm({ formData, onChange, onSave, onCancel }) {
  const setField = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className={styles.form}>
      <label>Display Name</label>
      <input 
        type="text" 
        value={formData.displayName} 
        onChange={(e) => setField('displayName', e.target.value)} 
      />
      
      <label>Bio</label>
      <textarea 
        value={formData.bio} 
        onChange={(e) => setField('bio', e.target.value)} 
      />
      
      <label>Theme Preference</label>
      <select 
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
