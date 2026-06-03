import { useChatMessages } from '../../../hooks/useChatMessages/useChatMessages';
import ChatHeader from './components/ChatHeader/ChatHeader';
import MessageList from './components/MessageList/MessageList';
import MessageInput from './components/MessageInput/MessageInput';
import { getConversationName } from '../../../utils/getConversationName';
import styles from './ChatWindow.module.css';

export default function ChatWindow({ activeChat, currentUserId, onNewMessageSent }) {
  const { messages, sending, sendMessage } = useChatMessages(activeChat);

  const handleInterceptSendMessage = async (textContent) => {
    const newlyCreatedMessage = await sendMessage(textContent);
    if (onNewMessageSent && newlyCreatedMessage) {
      onNewMessageSent(newlyCreatedMessage);
    }
  };

  if (!activeChat) {
    return (
      <div className={styles.placeholder} data-testid="chat-window-placeholder">
        <h3>Select a conversation channel to start messaging</h3>
      </div>
    );
  }

  // 2. Dynamically resolve the correct title text string
  const resolvedChatTitle = getConversationName(activeChat, currentUserId);

  // 1. Find the parent participant record row object
  const companionRecord = !activeChat.isGroup 
    ? activeChat.participants?.find(p => p.userId !== currentUserId)
    : null;

  // 2. Extract the nested user profile object explicitly from that record
  const partnerUser = companionRecord?.user || null;

  // 3. Extract the explicit boolean state safely, forcing a strict boolean evaluate
  const isPartnerOnline = partnerUser ? partnerUser.isOnline === true : false;

  console.log("DEBUG PRESENCE MATRIX:", {
    chatName: activeChat.name,
    rawParticipantsArray: activeChat.participants,
    isolatedPartnerObject: partnerUser,
    finalEvaluatedFlag: isPartnerOnline
  });

  return (
    <section className={styles.window} data-testid="chat-window-container">
      {/* 3. Pass the resolved title here instead of activeChat.name */}
      <ChatHeader title={resolvedChatTitle} isOnline={isPartnerOnline} isGroup={activeChat.isGroup} /> 
      
      <MessageList messages={messages} currentUserId={currentUserId} isGroup={activeChat.isGroup} />
      <MessageInput onSendMessage={handleInterceptSendMessage} disabled={sending} />
    </section>
  );
}
