import { describe, it, expect } from 'vitest';
import { getConversationName } from './getConversationName';

describe('getConversationName Utility String-Object Hybrid Suite', () => {
  const currentUserId = 'user-123';

  it('should return a group chat name string directly with a null targetUser payload', () => {
    const mockGroupChat = {
      id: 'group-xyz',
      isGroup: true,
      name: 'The Citadel Alliance'
    };

    const result = getConversationName(mockGroupChat, currentUserId);

    // Assert string evaluation characteristics pass standard checks
    expect(result.toString()).toBe('The Citadel Alliance');
    expect(String(result)).toBe('The Citadel Alliance');

    // Assert hybrid metadata payload blocks match group context blueprints
    expect(result.targetUser).toBeNull();
  });

  it('should resolve direct messages by finding the foreign participant and linking their user data', () => {
    const mockDirectChat = {
      id: 'dm-abc',
      isGroup: false,
      participants: [
        { userId: 'user-123', user: { id: 'user-123', displayName: 'Odin Boss', username: 'odin' } },
        { userId: 'user-456', user: { id: 'user-456', displayName: 'Heimdall', username: 'heimdall_sky' } }
      ]
    };

    const result = getConversationName(mockDirectChat, currentUserId);

    // Assert string resolves to foreign user display name preference
    expect(result.toString()).toBe('Heimdall');
    
    // Assert target user profile structure is perfectly retained for status badge hooks
    expect(result.targetUser).toEqual({
      id: 'user-456',
      displayName: 'Heimdall',
      username: 'heimdall_sky'
    });
  });

  it('should fall back gracefully to the handle username if displayName is omitted', () => {
    const mockDirectChatNoName = {
      id: 'dm-abc',
      isGroup: false,
      participants: [
        { userId: 'user-123', user: { id: 'user-123', displayName: 'Odin' } },
        { userId: 'user-456', user: { id: 'user-456', username: 'lone_rookie' } } // No displayName
      ]
    };

    const result = getConversationName(mockDirectChatNoName, currentUserId);

    expect(result.toString()).toBe('lone_rookie');
    expect(result.targetUser.username).toBe('lone_rookie');
  });

  it('should return a fallback placeholder if no foreign participant user data can be extracted', () => {
    const mockCorruptedChat = {
      id: 'dm-corrupt',
      isGroup: false,
      participants: [
        { userId: 'user-123', user: { id: 'user-123', displayName: 'Odin' } }
      ]
    };

    const result = getConversationName(mockCorruptedChat, currentUserId);

    // Fixed: Matches your code's true Section 3 design layout parameters exactly
    expect(result.toString()).toBe('Private Chat');
    expect(result.targetUser).toBeNull();
  });
});
