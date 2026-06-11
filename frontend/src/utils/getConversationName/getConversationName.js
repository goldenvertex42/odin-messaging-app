export const getConversationName = (conversation, currentUserId) => {
  if (!conversation) return '';

  // 1. Group Chat Strategy
  if (conversation.isGroup && conversation.name) {
    const result = conversation.name;
    // Attach an empty reference to prevent breaking object properties down the line
    return Object.assign(new String(result), { targetUser: null });
  }

  // 2. 1:1 Direct Message Strategy
  if (conversation.participants && conversation.participants.length > 0) {
    const otherParticipant = conversation.participants.find(
      p => p.userId !== currentUserId
    );
    
    if (otherParticipant && otherParticipant.user) {
      const userObj = otherParticipant.user;
      const title = userObj.displayName || userObj.username || 'Chat Partner';
      
      // Magic trick: returns a string but carries the target user data payload block cleanly!
      return Object.assign(new String(title), { targetUser: userObj });
    }
  }

  // 3. Fallback Layout Strategy
  const fallback = conversation.name || 'Private Chat';
  return Object.assign(new String(fallback), { targetUser: null });
};
