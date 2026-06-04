import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  },
}));

describe('ProfileCard Presentation & Interactive Suite', () => {
  const mockProfile = {
    username: 'johndoe',
    displayName: 'John Doe',
    bio: 'Full-stack software engineer.',
  };

  test('renders user identity headers and text accurately using display name', () => {
    render(
      <ProfileCard 
        profile={mockProfile} 
        isSelf={false} 
        onEditClick={vi.fn()} 
        onMessageClick={vi.fn()} 
      />
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('John Doe');
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
    expect(screen.getByText('Full-stack software engineer.')).toBeInTheDocument();
  });

  test('falls back cleanly to username when displayName is absent', () => {
    const fallbackProfile = { ...mockProfile, displayName: '' };
    
    render(
      <ProfileCard 
        profile={fallbackProfile} 
        isSelf={false} 
        onEditClick={vi.fn()} 
        onMessageClick={vi.fn()} 
      />
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('johndoe');
  });

  test('displays structural fallback text when bio is empty or missing', () => {
    const emptyBioProfile = { ...mockProfile, bio: '' };
    
    render(
      <ProfileCard 
        profile={emptyBioProfile} 
        isSelf={false} 
        onEditClick={vi.fn()} 
        onMessageClick={vi.fn()} 
      />
    );

    expect(screen.getByText('No bio written yet.')).toBeInTheDocument();
  });

  test('renders Edit Profile action when profile belongs to self', async () => {
    const handleEditClick = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileCard 
        profile={mockProfile} 
        isSelf={true} 
        onEditClick={handleEditClick} 
        onMessageClick={vi.fn()} 
      />
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
      <ProfileCard 
        profile={mockProfile} 
        isSelf={false} 
        onEditClick={vi.fn()} 
        onMessageClick={handleMessageClick} 
      />
    );

    const messageBtn = screen.getByRole('button', { name: /send message/i });
    expect(messageBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();

    await user.click(messageBtn);
    expect(handleMessageClick).toHaveBeenCalledTimes(1);
  });
});
