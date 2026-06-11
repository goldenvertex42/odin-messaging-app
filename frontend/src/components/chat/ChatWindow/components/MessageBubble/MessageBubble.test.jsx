import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageBubble from './MessageBubble';
import { vi } from 'vitest';

describe('MessageBubble Component', () => {
  const currentUserId = 'user-123';
  
  const defaultMessage = {
    id: 'msg-abc',
    senderId: 'user-456',
    content: 'Hello World!',
    createdAt: '2026-06-11T10:00:00.000Z',
    sender: {
      id: 'user-456',
      displayName: 'Alice Vance',
    },
  };

  it('returns null safely if the message object is missing', () => {
    const { container } = render(
      <MessageBubble 
        message={null} 
        currentUserId={currentUserId} 
        isGroup={false} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('aligns bubble to the left when the message belongs to another user', () => {
    const { container } = render(
      <MessageBubble 
        message={defaultMessage} 
        currentUserId={currentUserId} 
        isGroup={false} 
      />
    );
    
    const containerDiv = container.firstChild;
    expect(containerDiv.className).to.match(/alignLeft/);
    expect(containerDiv.className).not.to.match(/alignRight/);
  });

  it('aligns bubble to the right when the sender matches currentUserId directly', () => {
    const myMessage = { ...defaultMessage, senderId: currentUserId };
    const { container } = render(
      <MessageBubble 
        message={myMessage} 
        currentUserId={currentUserId} 
        isGroup={false} 
      />
    );
    
    const containerDiv = container.firstChild;
    expect(containerDiv.className).to.match(/alignRight/);
    expect(containerDiv.className).not.to.match(/alignLeft/);
  });

  it('aligns bubble to the right when matched via nested sender relation', () => {
    const myMessage = { 
      ...defaultMessage, 
      senderId: 'different-id', 
      sender: { id: currentUserId, displayName: 'Me' } 
    };
    const { container } = render(
      <MessageBubble 
        message={myMessage} 
        currentUserId={currentUserId} 
        isGroup={false} 
      />
    );
    
    const containerDiv = container.firstChild;
    expect(containerDiv.className).to.match(/alignRight/);
  });

  it('renders the sender metadata label in a group chat for another user', () => {
    render(
      <MessageBubble 
        message={defaultMessage} 
        currentUserId={currentUserId} 
        isGroup={true} 
      />
    );
    
    const label = screen.getByText('Alice Vance');
    expect(label).toBeInTheDocument();
    expect(label.className).to.match(/senderLabel/);
  });

  it('uses default fallback label when sender displayName is missing in a group chat', () => {
    const missingNameMessage = {
      ...defaultMessage,
      sender: { id: 'user-456' }
    };
    
    render(
      <MessageBubble 
        message={missingNameMessage} 
        currentUserId={currentUserId} 
        isGroup={true} 
      />
    );
    
    expect(screen.getByText('unknown_user')).toBeInTheDocument();
  });

  it('hides the sender metadata label in group chats if the message belongs to me', () => {
    const myMessage = { ...defaultMessage, senderId: currentUserId };
    render(
      <MessageBubble 
        message={myMessage} 
        currentUserId={currentUserId} 
        isGroup={true} 
      />
    );
    
    const label = screen.queryByText('Alice Vance');
    expect(label).not.toBeInTheDocument();
  });

  it('renders an image attachment and fires onImageClick with the correct URL asset payload', () => {
    const mockOnImageClick = vi.fn();
    const mediaMessage = {
      ...defaultMessage,
      fileUrl: 'https://example.com'
    };

    render(
      <MessageBubble 
        message={mediaMessage} 
        currentUserId={currentUserId} 
        isGroup={false} 
        onImageClick={mockOnImageClick}
      />
    );

    const image = screen.getByRole('img', { name: /shared asset payload/i });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com');

    fireEvent.click(image);
    expect(mockOnImageClick).toHaveBeenCalledTimes(1);
    expect(mockOnImageClick).toHaveBeenCalledWith('https://example.com');
  });

  it('does not crash when clicking an attachment image if onImageClick is undefined', () => {
    const mediaMessage = { ...defaultMessage, fileUrl: 'https://example.com' };
    
    render(
      <MessageBubble 
        message={mediaMessage} 
        currentUserId={currentUserId} 
        isGroup={false} 
      />
    );

    const image = screen.getByRole('img');
    expect(() => fireEvent.click(image)).not.toThrow();
  });

  it('formats and prints a localized timestamp inside the chat bubble bubble layer', () => {
    render(
      <MessageBubble 
        message={defaultMessage} 
        currentUserId={currentUserId} 
        isGroup={false} 
      />
    );
    
    const expectedTime = new Date(defaultMessage.createdAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });
});
