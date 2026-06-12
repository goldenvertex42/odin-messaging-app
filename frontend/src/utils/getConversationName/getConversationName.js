export const getConversationName = (conversation, currentUserId) => {
  if (!conversation) return '';

  // 1. Group Chat Strategy
  if (conversation.isGroup) {
    // If an explicit custom name exists in the DB, use it!
    if (conversation.name && !conversation.name.startsWith('Group with ')) {
      return Object.assign(new String(conversation.name), { targetUser: null });
    }

    // Dynamic Group Fallback Name based on active participants
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipants = conversation.participants
        .filter(p => p.userId !== currentUserId)
        .map(p => p.user?.displayName || p.user?.username)
        .filter(Boolean);

      let groupTitle = 'Group Chat';
      if (otherParticipants.length === 1) {
        groupTitle = `Group with ${otherParticipants[0]}`;
      } else if (otherParticipants.length === 2) {
        groupTitle = `Group with ${otherParticipants[0]} and ${otherParticipants[1]}`;
      } else if (otherParticipants.length > 2) {
        groupTitle = `Group with ${otherParticipants[0]}, ${otherParticipants[1]} and ${otherParticipants.length - 2} others`;
      }

      return Object.assign(new String(groupTitle), { targetUser: null });
    }
  }

  // 2. 1:1 Direct Message Strategy
  if (conversation.participants && conversation.participants.length > 0) {
    const otherParticipant = conversation.participants.find(
      p => p.userId !== currentUserId
    );
    if (otherParticipant && otherParticipant.user) {
      const userObj = otherParticipant.user;
      const title = userObj.displayName || userObj.username || 'Chat Partner';
      return Object.assign(new String(title), { targetUser: userObj });
    }
  }

  // 3. Fallback Layout Strategy
  const fallback = conversation.name || 'Private Chat';
  return Object.assign(new String(fallback), { targetUser: null });
};
