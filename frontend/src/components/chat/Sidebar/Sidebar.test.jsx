import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from './Sidebar';

describe('Sidebar Component - Production Integration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const mockConversations = [
    {
      id: 'chat-uuid-1',
      isGroup: false,
      participants: [
        { user: { id: 'current-user', displayName: 'Odin Dev' } },
        { user: { id: 'other-user-1', displayName: 'Thor' } }
      ],
      messages: [{ content: 'Hey there!' }]
    }
  ];

  it('should render an empty sidebar when no conversations are provided', () => {
    render(<Sidebar conversations={[]} currentUserId="current-user" onSelectChat={vi.fn()} />);

    expect(screen.getByTestId('sidebar-container')).toBeInTheDocument();
    expect(screen.queryByText('Thor')).not.toBeInTheDocument();
    expect(screen.queryByText('Hey there!')).not.toBeInTheDocument();
  });

  it('should display names and direct messaging previews correctly when data loads', () => {
    render(
      <Sidebar
        conversations={mockConversations}
        currentUserId="current-user"
        onSelectChat={vi.fn()}
      />
    );

    expect(screen.getByTestId('sidebar-container')).toBeInTheDocument();
    expect(screen.getByText('Thor')).toBeInTheDocument();
    expect(screen.getByText('Hey there!')).toBeInTheDocument();
  });

  it('should show the most recent message preview when multiple messages exist', () => {
    const conversationsWithHistory = [
      {
        ...mockConversations[0],
        messages: [
          { content: 'Newest message', createdAt: '2026-01-01T12:00:00.000Z' },
          { content: 'Old message', createdAt: '2026-01-01T10:00:00.000Z' }
        ]
      }
    ];

    render(
      <Sidebar
        conversations={conversationsWithHistory}
        currentUserId="current-user"
        onSelectChat={vi.fn()}
      />
    );

    expect(screen.getByText('Newest message')).toBeInTheDocument();
    expect(screen.queryByText('Old message')).not.toBeInTheDocument();
  });

  it('should dispatch onSelectChat callbacks when user clicks a specific thread node row', async () => {
    const user = userEvent.setup();
    const mockSelectCallback = vi.fn();

    render(
      <Sidebar
        conversations={mockConversations}
        currentUserId="current-user"
        onSelectChat={mockSelectCallback}
      />
    );

    const clickTarget = screen.getByText('Thor');
    await user.click(clickTarget);

    expect(mockSelectCallback).toHaveBeenCalledTimes(1);
    expect(mockSelectCallback).toHaveBeenCalledWith(mockConversations[0]);
  });
});
