import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewChatButton from './NewChatButton';

// 1. Mock the NewChatModal child component to cleanly isolate button state tracking
vi.mock('../NewChatModal/NewChatModal', () => {
  return {
    default: function MockNewChatModal({ isOpen, onClose, onCreateConversation }) {
      if (!isOpen) return null;
      return (
        <div data-testid="mock-new-chat-modal">
          <span>Modal Content Staged</span>
          <button onClick={onClose} aria-label="Close Modal">Dismiss</button>
          <button onClick={() => onCreateConversation({ id: 'conv-999' })}>Create</button>
        </div>
      );
    }
  };
});

describe('NewChatButton Component', () => {
  const mockOnCreateConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trigger button with default layout text and unmounted modal state', () => {
    render(<NewChatButton onCreateConversation={mockOnCreateConversation} />);
    
    const triggerBtn = screen.getByRole('button', { name: /\+ new chat/i });
    expect(triggerBtn).toBeInTheDocument();
    
    // Assert the modal portal layer is completely omitted from the viewport tree initially
    expect(screen.queryByTestId('mock-new-chat-modal')).not.toBeInTheDocument();
  });

  it('opens the interaction modal layout frame when the trigger button is clicked', () => {
    render(<NewChatButton onCreateConversation={mockOnCreateConversation} />);
    
    const triggerBtn = screen.getByRole('button', { name: /\+ new chat/i });
    fireEvent.click(triggerBtn);

    // Verify modal container successfully updates visibility flags and mounts to DOM
    expect(screen.getByTestId('mock-new-chat-modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content Staged')).toBeInTheDocument();
  });

  it('closes the modal and cleans up visible nodes when receiving an onClose event fallback update', () => {
    render(<NewChatButton onCreateConversation={mockOnCreateConversation} />);
    
    // 1. Open the modal container layout
    const triggerBtn = screen.getByRole('button', { name: /\+ new chat/i });
    fireEvent.click(triggerBtn);
    expect(screen.getByTestId('mock-new-chat-modal')).toBeInTheDocument();

    // 2. Trigger the mocked onClose parameter callback button hook
    const dismissBtn = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(dismissBtn);

    // Assert localized component state flips back to false, stripping modal tree components out
    expect(screen.queryByTestId('mock-new-chat-modal')).not.toBeInTheDocument();
  });

  it('forwards conversation creation triggers cleanly to the parent component context', () => {
    render(<NewChatButton onCreateConversation={mockOnCreateConversation} />);
    
    // Open the interaction overlay container
    const triggerBtn = screen.getByRole('button', { name: /\+ new chat/i });
    fireEvent.click(triggerBtn);

    // Execute mock click submit handler event
    const createBtn = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(createBtn);

    expect(mockOnCreateConversation).toHaveBeenCalledTimes(1);
    expect(mockOnCreateConversation).toHaveBeenCalledWith({ id: 'conv-999' });
  });
});
