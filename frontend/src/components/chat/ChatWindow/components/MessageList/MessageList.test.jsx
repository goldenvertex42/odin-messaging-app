import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import MessageList from './MessageList';

// Mock MessageBubble child component to isolate test scope cleanly
vi.mock('../MessageBubble/MessageBubble', () => {
  return {
    default: function MockMessageBubble({ message, currentUserId, isGroup, onImageClick }) {
      return (
        <div data-testid="mock-message-bubble">
          <span>{message.content}</span>
          <button onClick={() => onImageClick && onImageClick(message.fileUrl)}>
            Preview Image
          </button>
        </div>
      );
    }
  };
});

describe('MessageList Component', () => {
  const currentUserId = 'user-123';
  const mockOnImagePreviewRequested = vi.fn();

  const mockMessages = [
    { id: 'm1', content: 'First message', fileUrl: 'url-1' },
    { id: 'm2', content: 'Second message', fileUrl: 'url-2' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Polyfill scrollIntoView on Element prototype since jsdom doesn't implement layout methods
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders empty state placeholder text when message array is empty', () => {
    render(
      <MessageList 
        messages={[]} 
        currentUserId={currentUserId} 
        isGroup={false} 
        onImagePreviewRequested={mockOnImagePreviewRequested} 
      />
    );

    expect(screen.getByText('No messages yet. Say hello!')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-message-bubble')).not.toBeInTheDocument();
  });

  it('renders a list of message bubbles matching the messages array size', () => {
    render(
      <MessageList 
        messages={mockMessages} 
        currentUserId={currentUserId} 
        isGroup={false} 
        onImagePreviewRequested={mockOnImagePreviewRequested} 
      />
    );

    const bubbles = screen.getAllByTestId('mock-message-bubble');
    expect(bubbles).toHaveLength(2);
    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('correctly passes callback handlers and metadata variables to children bubble layers', () => {
    render(
      <MessageList 
        messages={[mockMessages[0]]} 
        currentUserId={currentUserId} 
        isGroup={true} 
        onImagePreviewRequested={mockOnImagePreviewRequested} 
      />
    );

    // Fire the mock bubble trigger to check callback forwarding connectivity
    const previewBtn = screen.getByText('Preview Image');
    previewBtn.click();

    expect(mockOnImagePreviewRequested).toHaveBeenCalledTimes(1);
    expect(mockOnImagePreviewRequested).toHaveBeenCalledWith('url-1');
  });

  it('automatically triggers smooth scrolling layout container methods on mount and update cycles', () => {
    const { rerender } = render(
      <MessageList 
        messages={[mockMessages[0]]} 
        currentUserId={currentUserId} 
        isGroup={false} 
        onImagePreviewRequested={mockOnImagePreviewRequested} 
      />
    );

    // Assert auto scroll ran on initial mount
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    // Stream append update mutation
    rerender(
      <MessageList 
        messages={mockMessages} 
        currentUserId={currentUserId} 
        isGroup={false} 
        onImagePreviewRequested={mockOnImagePreviewRequested} 
      />
    );

    // Assert scroll triggered again due to dependency array array change detection
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
