import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewChatModal from './NewChatModal';
import { useFriendSearch } from '../../../../../hooks/useFriendSearch/useFriendSearch';

// Mock the useFriendSearch custom hook layer dependencies completely
vi.mock('../../../../../hooks/useFriendSearch/useFriendSearch', () => ({
  useFriendSearch: vi.fn()
}));

describe('NewChatModal Component - Vitest Suite', () => {
  const mockOnClose = vi.fn();
  const mockOnCreateConversation = vi.fn();

  const defaultSuggestionsMock = [
    { id: 'f1', username: 'alex_99', displayName: 'Alex Rivera', avatarUrl: '/avatar1.png' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useFriendSearch.mockReturnValue({ suggestions: [] });
  });

  it('renders absolutely nothing when isOpen is false', () => {
    const { container } = render(
      <NewChatModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the core form fields and headings accurately when opened', () => {
    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    expect(screen.getByRole('heading', { name: /start a new chat/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username...')).toBeInTheDocument();
  });

  it('stages an isolated user token tag when typing a recipient handle and pressing Enter', () => {
    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    const input = screen.getByPlaceholderText('Enter username...');
    
    // Wrap triggers that schedule multiple macro/micro state changes inside act
    act(() => {
      fireEvent.change(input, { target: { value: 'clara_b' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    expect(screen.getByText(/clara_b/i)).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('stages token blocks cleanly when delimiters like a comma are used instead', () => {
    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    const input = screen.getByPlaceholderText('Enter username...');
    
    act(() => {
      fireEvent.change(input, { target: { value: 'marcus_k,' } });
      fireEvent.keyDown(input, { key: ',', code: 'Comma' });
    });

    expect(screen.getByText(/marcus_k/i)).toBeInTheDocument();
  });

  it('blocks double token ingestion loops and prints an inline validation message error block', () => {
    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    const input = screen.getByPlaceholderText('Enter username...');
    
    act(() => {
      fireEvent.change(input, { target: { value: 'duplicate_user' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    act(() => {
      fireEvent.change(input, { target: { value: 'duplicate_user' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(screen.getByText('User has already been added to this thread.')).toBeInTheDocument();
  });

  it('mounts group name field input row dynamically once more than one participant user is added', () => {
    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    const input = screen.getByPlaceholderText('Enter username...');
    
    act(() => {
      fireEvent.change(input, { target: { value: 'user_one' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    act(() => {
      fireEvent.change(input, { target: { value: 'user_two' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(screen.getByPlaceholderText('Enter group conversation name...')).toBeInTheDocument();
  });

  it('unstages targeted recipient token tags from state on index button removals', () => {
    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    const input = screen.getByPlaceholderText('Enter username...');
    act(() => {
      fireEvent.change(input, { target: { value: 'delete_me' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    const removeBtn = screen.getByRole('button', { name: '×' });
    act(() => {
      fireEvent.click(removeBtn);
    });

    expect(screen.queryByText(/delete_me/i)).not.toBeInTheDocument();
  });

  it('submits a single recipient direct chat pipeline cleanly on form submissions', async () => {
    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    const input = screen.getByPlaceholderText('Enter username...');
    fireEvent.change(input, { target: { value: 'lone_wolf' } });
    
    const form = input.closest('form');
    
    // Wrap async form submissions that trigger clear-outs and onClose calls inside act
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(mockOnCreateConversation).toHaveBeenCalledTimes(1);
    expect(mockOnCreateConversation).toHaveBeenCalledWith(['lone_wolf'], null);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('submits a group chat parameter profile payload bundle matching layout configs', async () => {
    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    const input = screen.getByPlaceholderText('Enter username...');
    
    act(() => {
      fireEvent.change(input, { target: { value: 'alpha' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.change(input, { target: { value: 'beta' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    const groupNameInput = screen.getByPlaceholderText('Enter group conversation name...');
    fireEvent.change(groupNameInput, { target: { value: 'The Avengers Alliance' } });

    const form = input.closest('form');
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(mockOnCreateConversation).toHaveBeenCalledTimes(1);
    expect(mockOnCreateConversation).toHaveBeenCalledWith(['alpha', 'beta'], 'The Avengers Alliance');
  });

  it('displays friend search dropdown items and appends suggestions on click events', async () => {
    useFriendSearch.mockReturnValue({ suggestions: defaultSuggestionsMock });

    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    const suggestionRow = screen.getByText('Alex Rivera');
    expect(suggestionRow).toBeInTheDocument();

    // Clicking a dropdown suggestion triggers multiple internal state modifications
    act(() => {
      fireEvent.click(suggestionRow);
    });

    const matchedTokens = screen.getAllByText(/alex_99/i);
    expect(matchedTokens.length).toBeGreaterThanOrEqual(1);
  });

  it('triggers an onClose layout cancellation signal bubble callback upon dialog background clicks', () => {
    render(
      <NewChatModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onCreateConversation={mockOnCreateConversation} 
      />
    );

    const dialogBackdropOverlay = screen.getByRole('dialog');
    act(() => {
      fireEvent.click(dialogBackdropOverlay);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
