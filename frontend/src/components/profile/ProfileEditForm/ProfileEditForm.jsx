import styles from './ProfileEditForm.module.css';
import parentStyles from '../../../pages/ProfilePage/ProfilePage.module.css';

const AVAILABLE_THEMES = ['SLATE', 'EMERALD', 'OCEAN', 'AMETHYST', 'ROSE'];

export default function ProfileEditForm({ formData, onChange, onSave, onCancel }) {
  const setField = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return ( 
    <div className={styles.form}> 
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
