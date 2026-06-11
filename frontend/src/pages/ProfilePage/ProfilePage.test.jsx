import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../../tests/test-utils';
import ProfilePage from './ProfilePage';
import { customFetch } from '../../utils/api/api';

// 1. Mock child presentation components to isolate orchestrator network mechanics
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
      <input data-testid="input-displayname" value={formData.displayName} onChange={(e) => onChange({ ...formData, displayName: e.target.value })} />
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

// 2. Mock out the explicit customFetch module that the component utilizes internally
vi.mock('../../utils/api/api', () => ({
  customFetch: vi.fn()
}));

describe('ProfilePage Full-Stack Orchestration Suite', () => {
  const mockCurrentUser = { id: 'user-id-123', username: 'johndoe', displayName: 'John Doe', themePreference: 'SLATE' };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'mock-valid-jwt-token');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  test('fetches and mounts self profile view when no username routing token is present', async () => {
    const mockProfileData = { username: 'johndoe', displayName: 'John Doe', bio: 'Developer bio text.', themePreference: 'SLATE' };
    
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockProfileData })
    });

    renderWithRouter(
      <ProfilePage currentUser={mockCurrentUser} onGlobalThemeChange={vi.fn()} />,
      { route: '/' }
    );

    const profileCard = await screen.findByTestId('mock-profile-card');
    expect(profileCard).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('John Doe');
  });

  test('fetches a foreign user profile details cleanly matching layout params tokens', async () => {
    const mockForeignProfile = { username: 'janedoe', displayName: 'Jane Doe', bio: 'External user bio text.', themePreference: 'OCEAN' };
    
    customFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockForeignProfile })
    });

    renderWithRouter(
      <ProfilePage currentUser={mockCurrentUser} onGlobalThemeChange={vi.fn()} />,
      { route: '/profile/janedoe', path: '/profile/:username' }
    );

    const profileCard = await screen.findByTestId('mock-profile-card');
    expect(profileCard).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Jane Doe');
  });

  test('switches interfaces seamlessly to editing workspace view and triggers database mutations on save', async () => {
    const mockProfileData = { username: 'johndoe', displayName: 'Original Name', bio: 'Original Bio', themePreference: 'SLATE' };
    const mockUpdatedData = { ...mockProfileData, displayName: 'Updated Name', themePreference: 'EMERALD' };
    const handleGlobalThemeChange = vi.fn();
    const user = userEvent.setup();

    // 1st call: Hydrate on mount
    // 2nd call: Save profile adjustments
    customFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockProfileData }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockUpdatedData }) });

    renderWithRouter(
      <ProfilePage currentUser={mockCurrentUser} onGlobalThemeChange={handleGlobalThemeChange} />,
      { route: '/' }
    );

    await screen.findByTestId('mock-profile-card');

    const editBtn = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editBtn);
    expect(screen.getByTestId('mock-profile-form')).toBeInTheDocument();

    const nameInput = screen.getByTestId('input-displayname');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const saveBtn = screen.getByRole('button', { name: /save/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('mock-profile-card')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Updated Name');
    expect(handleGlobalThemeChange).toHaveBeenCalledWith('EMERALD');
  });

  test('routes target users automatically to standard direct messaging pathways upon DM creation actions', async () => {
    const mockForeignProfile = { username: 'janedoe', displayName: 'Jane Doe', themePreference: 'AMETHYST' };
    const user = userEvent.setup();
    
    const dynamicRoutes = [
      { path: '/profile/:username', Component: () => <ProfilePage currentUser={mockCurrentUser} onGlobalThemeChange={vi.fn()} /> },
      { path: '/conversations/:activeConversationId', Component: () => <div data-testid="target-dm-workspace">Dynamic Conversation Workspace</div> }
    ];

    // 1st call: Hydrate profile on mount
    // 2nd call: Intercept conversation generation payload
    customFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: mockForeignProfile }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { id: 'conversation-id-789' } }) });

    renderWithRouter(null, { route: '/profile/janedoe', customRoutes: dynamicRoutes });
    await screen.findByTestId('mock-profile-card');

    const messageBtn = screen.getByRole('button', { name: /send message/i });
    await user.click(messageBtn);

    const dmWorkspace = await screen.findByTestId('target-dm-workspace');
    expect(dmWorkspace).toBeInTheDocument();

    expect(customFetch).toHaveBeenCalledWith('/api/conversations', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ usernames: ['janedoe'] })
    }));
  });
});
