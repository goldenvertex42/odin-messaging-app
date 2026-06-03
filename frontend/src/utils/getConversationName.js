export const getConversationName = (conversation, currentUserId) => {
  if (!conversation) return '';

  // 1. If it's explicitly a group chat and has a saved name, use it
  if (conversation.isGroup && conversation.name) {
    return conversation.name;
  }

  // 2. If it's a 1:1 chat, find the companion user profile
  if (conversation.participants && conversation.participants.length > 0) {
    const otherParticipant = conversation.participants.find(
      p => p.userId !== currentUserId
    );

    if (otherParticipant && otherParticipant.user) {
      return otherParticipant.user.displayName || otherParticipant.user.username || 'Chat Partner';
    }
  }

  // 3. Fallback if the participant list hasn't loaded yet or is empty
  return conversation.name || 'Private Chat';
};
