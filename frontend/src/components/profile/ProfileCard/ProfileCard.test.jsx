import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import ProfileCard from './ProfileCard';

// Mocking CSS module imports to prevent runtime style execution errors
vi.mock('./ProfileCard.module.css', () => ({
  default: {
    view: 'mocked-view-class',
    handle: 'mocked-handle-class',
    bio: 'mocked-bio-class',
  },
}));

vi.mock('../../../pages/ProfilePage/ProfilePage.module.css', () => ({
  default: {
    actions: 'mocked-actions-class',
    btnEdit: 'mocked-btnEdit-class',
    btnMessage: 'mocked-btnMessage-class',
    btnAddFriend: 'mocked-btnAddFriend-class',
    btnPending: 'mocked-btnPending-class',
  },
}));

describe('ProfileCard Presentation & Interactive Suite', () => {
  const mockProfile = {
    id: 'user-id-123',
    username: 'johndoe',
    displayName: 'John Doe',
    bio: 'Full-stack software engineer.',
  };

  test('renders user identity headers and text accurately using display name', () => {
    render(
      <MemoryRouter>
        <ProfileCard 
          profile={mockProfile} 
          isSelf={false} 
          onEditClick={vi.fn()} 
          onMessageClick={vi.fn()} 
          onAddFriendClick={vi.fn()}
          relationshipStatus="ACCEPTED"
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('John Doe');
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
    expect(screen.getByText('Full-stack software engineer.')).toBeInTheDocument();
  });

  test('falls back cleanly to username when displayName is absent', () => {
    const fallbackProfile = { ...mockProfile, displayName: '' };
    render(
      <MemoryRouter>
        <ProfileCard 
          profile={fallbackProfile} 
          isSelf={false} 
          onEditClick={vi.fn()} 
          onMessageClick={vi.fn()} 
          onAddFriendClick={vi.fn()}
          relationshipStatus="ACCEPTED"
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('johndoe');
  });

  test('displays structural fallback text when bio is empty or missing', () => {
    const emptyBioProfile = { ...mockProfile, bio: '' };
    render(
      <MemoryRouter>
        <ProfileCard 
          profile={emptyBioProfile} 
          isSelf={false} 
          onEditClick={vi.fn()} 
          onMessageClick={vi.fn()} 
          onAddFriendClick={vi.fn()}
          relationshipStatus="ACCEPTED"
        />
      </MemoryRouter>
    );
    expect(screen.getByText('No bio written yet.')).toBeInTheDocument();
  });

  test('renders Edit Profile action when profile belongs to self', async () => {
    const handleEditClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <ProfileCard 
          profile={mockProfile} 
          isSelf={true} 
          onEditClick={handleEditClick} 
          onMessageClick={vi.fn()} 
          onAddFriendClick={vi.fn()}
          relationshipStatus="NONE"
        />
      </MemoryRouter>
    );
    const editBtn = screen.getByRole('button', { name: /edit profile/i });
    expect(editBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument();
    await user.click(editBtn);
    expect(handleEditClick).toHaveBeenCalledTimes(1);
  });

  test('renders Send Message action when profile belongs to a companion user', async () => {
    const handleMessageClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <ProfileCard 
          profile={mockProfile} 
          isSelf={false} 
          onEditClick={vi.fn()} 
          onMessageClick={handleMessageClick} 
          onAddFriendClick={vi.fn()}
          relationshipStatus="ACCEPTED"
        />
      </MemoryRouter>
    );
    
    const messageBtn = screen.getByRole('button', { name: /send message/i });
    expect(messageBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add friend/i })).not.toBeInTheDocument();
    
    await user.click(messageBtn);
    expect(handleMessageClick).toHaveBeenCalledTimes(1);
  });

  test('renders Add Friend action button when relationshipStatus is NONE', async () => {
    const handleAddFriendClick = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfileCard 
          profile={mockProfile} 
          isSelf={false} 
          onEditClick={vi.fn()} 
          onMessageClick={vi.fn()} 
          onAddFriendClick={handleAddFriendClick}
          relationshipStatus="NONE"
        />
      </MemoryRouter>
    );

    const addFriendBtn = screen.getByRole('button', { name: /add friend/i });
    expect(addFriendBtn).toBeInTheDocument();
    
    await user.click(addFriendBtn);
    expect(handleAddFriendClick).toHaveBeenCalledWith(mockProfile.id);
  });

  test('renders disabled Request Pending label when relationshipStatus is PENDING', () => {
    render(
      <MemoryRouter>
        <ProfileCard 
          profile={mockProfile} 
          isSelf={false} 
          onEditClick={vi.fn()} 
          onMessageClick={vi.fn()} 
          onAddFriendClick={vi.fn()}
          relationshipStatus="PENDING"
        />
      </MemoryRouter>
    );

    const pendingBtn = screen.getByRole('button', { name: /request pending/i });
    expect(pendingBtn).toBeInTheDocument();
    expect(pendingBtn).toBeDisabled();
    expect(screen.queryByRole('button', { name: /add friend/i })).not.toBeInTheDocument();
  });
});
