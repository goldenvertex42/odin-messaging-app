import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../tests/test-utils';
import ProfilePage from './ProfilePage';

// Mock child presentation components to isolate orchestrator network mechanics
vi.mock('../../components/profile/ProfileCard/ProfileCard', () => ({
  default: ({ profile, isSelf, onEditClick, onMessageClick }) => (
    <div data-testid="mock-profile-card">
      <h2>{profile?.displayName || profile?.username}</h2>
      <p>{profile?.bio}</p>
      {isSelf ? (
        <button onClick={onEditClick}>Edit Profile</button>
      ) : (
        <button onClick={onMessageClick}>Send Message</button>
      )}
    </div>
  )
}));

vi.mock('../../components/profile/ProfileEditForm/ProfileEditForm', () => ({
  default: ({ formData, onChange, onSave, onCancel }) => (
    <div data-testid="mock-profile-form">
      <input 
        data-testid="input-displayname" 
        value={formData.displayName} 
        onChange={(e) => onChange({ ...formData, displayName: e.target.value })} 
      />
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

describe('ProfilePage Full-Stack Orchestration Suite', () => {
  const mockCurrentUser = {
    id: 'user-id-123',
    username: 'johndoe',
    displayName: 'John Doe',
    themePreference: 'SLATE'
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('token', 'mock-valid-jwt-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('fetches and mounts self profile view when no username routing token is present', async () => {
    const mockProfileData = {
      username: 'johndoe',
      displayName: 'John Doe',
      bio: 'Developer bio text.',
      themePreference: 'SLATE'
    };

    fetch.mockResolvedValueOnce({
      json: async () => ({ data: mockProfileData })
    });

    renderWithRouter(
      <ProfilePage currentUser={mockCurrentUser} onGlobalThemeChange={vi.fn()} />,
      { route: '/' }
    );

    // findBy queries wait automatically for the element to appear after fetch resolves
    const profileCard = await screen.findByTestId('mock-profile-card');
    expect(profileCard).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('John Doe');
  });

  test('fetches a foreign user profile details cleanly matching layout params tokens', async () => {
    const mockForeignProfile = {
      username: 'janedoe',
      displayName: 'Jane Doe',
      bio: 'External user bio text.',
      themePreference: 'OCEAN'
    };

    fetch.mockResolvedValueOnce({
      json: async () => ({ data: mockForeignProfile })
    });

    renderWithRouter(
      <ProfilePage currentUser={mockCurrentUser} onGlobalThemeChange={vi.fn()} />,
      { 
        route: '/profile/janedoe',
        path: '/profile/:username' 
      }
    );

    const profileCard = await screen.findByTestId('mock-profile-card');
    expect(profileCard).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Jane Doe');
  });

  test('switches interfaces seamlessly to editing workspace view and triggers database mutations on save', async () => {
    const mockProfileData = {
      username: 'johndoe',
      displayName: 'Original Name',
      bio: 'Original Bio',
      themePreference: 'SLATE'
    };

    const mockUpdatedData = { ...mockProfileData, displayName: 'Updated Name', themePreference: 'EMERALD' };
    const handleGlobalThemeChange = vi.fn();
    const user = userEvent.setup();

    fetch
      .mockResolvedValueOnce({ json: async () => ({ data: mockProfileData }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: mockUpdatedData }) });

    renderWithRouter(
      <ProfilePage currentUser={mockCurrentUser} onGlobalThemeChange={handleGlobalThemeChange} />,
      { route: '/' }
    );

    // Wait for baseline mount
    await screen.findByTestId('mock-profile-card');

    // Enter Edit Mode (userEvent handles its own state wrapping natively)
    const editBtn = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editBtn);
    expect(screen.getByTestId('mock-profile-form')).toBeInTheDocument();

    // Perform typing updates
    const nameInput = screen.getByTestId('input-displayname');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    // Fire save mutation transaction
    const saveBtn = screen.getByRole('button', { name: /save/i });
    await user.click(saveBtn);

    // Verify form closes and displays updated information
    await waitFor(() => {
      expect(screen.getByTestId('mock-profile-card')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Updated Name');
    expect(handleGlobalThemeChange).toHaveBeenCalledWith('EMERALD');
  });

  test('routes target users automatically to standard direct messaging pathways upon DM creation actions', async () => {
    const mockForeignProfile = {
      username: 'janedoe',
      displayName: 'Jane Doe',
      themePreference: 'AMETHYST'
    };

    const user = userEvent.setup();
    
    const dynamicRoutes = [
      {
        path: '/profile/:username',
        Component: () => <ProfilePage currentUser={mockCurrentUser} onGlobalThemeChange={vi.fn()} />
      },
      {
        path: '/conversations/:activeConversationId',
        Component: () => <div data-testid="target-dm-workspace">Dynamic Conversation Workspace</div>
      }
    ];

    fetch
      .mockResolvedValueOnce({ json: async () => ({ data: mockForeignProfile }) })
      .mockResolvedValueOnce({ 
        ok: true, 
        json: async () => ({ data: { id: 'conversation-id-789' } })
      });

    renderWithRouter(null, {
      route: '/profile/janedoe',
      customRoutes: dynamicRoutes
    });

    await screen.findByTestId('mock-profile-card');

    // Execute redirection sequence
    const messageBtn = screen.getByRole('button', { name: /send message/i });
    await user.click(messageBtn);

    // Verify router navigation targets the proper workspace layout safely
    const dmWorkspace = await screen.findByTestId('target-dm-workspace');
    expect(dmWorkspace).toBeInTheDocument();
  });
});
