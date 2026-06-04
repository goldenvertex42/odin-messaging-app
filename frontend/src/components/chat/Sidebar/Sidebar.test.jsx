import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router'; // ✅ Added to provide link context
import Sidebar from './Sidebar';

// 🎯 FIX 1: Mock the global AuthContext hook module before test execution
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    logout: vi.fn(),
  }),
}));

// Mock CSS Module imports to prevent structural path resolution failures
vi.mock('./Sidebar.module.css', () => ({
  default: {
    sidebar: 'mock-sidebar',
    titleArea: 'mock-title-area',
    list: 'mock-list',
    chatItem: 'mock-chat-item',
    isActive: 'mock-active',
    chatName: 'mock-chat-name',
    preview: 'mock-preview',
    footer: 'mock-footer',
    profileActions: 'mock-profile-actions',
    footerLink: 'mock-footer-link',
    logoutBtn: 'mock-logout-btn',
  },
}));

// Mock the NewChatButton to isolate sidebar navigation mechanics
vi.mock('./components/NewChatButton/NewChatButton', () => ({
  default: () => <button data-testid="mock-new-chat-btn">New Chat</button>,
}));

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
        { user: { id: 'other-user-1', displayName: 'Thor' } },
      ],
      messages: [{ content: 'Hey there!' }],
    },
  ];

  it('should render an empty sidebar when no conversations are provided', () => {
    // 🎯 FIX 2: Wrap inside MemoryRouter to resolve <Link> element requirements
    render(
      <MemoryRouter>
        <Sidebar conversations={[]} currentUserId="current-user" onSelectChat={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('sidebar-container')).toBeInTheDocument();
    expect(screen.queryByText('Thor')).not.toBeInTheDocument();
    expect(screen.queryByText('Hey there!')).not.toBeInTheDocument();
  });

  it('should display names and direct messaging previews correctly when data loads', () => {
    render(
      <MemoryRouter>
        <Sidebar conversations={mockConversations} currentUserId="current-user" onSelectChat={vi.fn()} />
      </MemoryRouter>
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
          { content: 'Old message', createdAt: '2026-01-01T10:00:00.000Z' },
        ],
      },
    ];
    render(
      <MemoryRouter>
        <Sidebar conversations={conversationsWithHistory} currentUserId="current-user" onSelectChat={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Newest message')).toBeInTheDocument();
    expect(screen.queryByText('Old message')).not.toBeInTheDocument();
  });

  it('should dispatch onSelectChat callbacks when user clicks a specific thread node row', async () => {
    const user = userEvent.setup();
    const mockSelectCallback = vi.fn();
    
    render(
      <MemoryRouter>
        <Sidebar conversations={mockConversations} currentUserId="current-user" onSelectChat={mockSelectCallback} />
      </MemoryRouter>
    );
    
    const clickTarget = screen.getByText('Thor');
    await user.click(clickTarget);
    
    expect(mockSelectCallback).toHaveBeenCalledTimes(1);
    expect(mockSelectCallback).toHaveBeenCalledWith(mockConversations[0]);
  });
});
