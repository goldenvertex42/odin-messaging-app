import { useChatMessages } from '../../../hooks/useChatMessages/useChatMessages';
import ChatHeader from './components/ChatHeader/ChatHeader';
import MessageList from './components/MessageList/MessageList';
import MessageInput from './components/MessageInput/MessageInput';
import { getConversationName } from '../../../utils/getConversationName';
import styles from './ChatWindow.module.css';

export default function ChatWindow({ activeChat, currentUserId, onNewMessageSent }) {
  const { messages, sending, sendMessage } = useChatMessages(activeChat);

  const handleInterceptSendMessage = async (textContent, fileAttachment = null) => {
    const newlyCreatedMessage = await sendMessage(textContent, fileAttachment);
    
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

  const resolvedChatTitle = getConversationName(activeChat, currentUserId);

  const companionRecord = !activeChat.isGroup 
    ? activeChat.participants?.find(p => p.userId !== currentUserId) 
    : null;

  const partnerUser = companionRecord?.user || null;

  const isPartnerOnline = partnerUser ? partnerUser.isOnline === true : false;

  return (
    <section className={styles.window} data-testid="chat-window-container">
      <ChatHeader title={resolvedChatTitle} isOnline={isPartnerOnline} isGroup={activeChat.isGroup} />
      <MessageList messages={messages} currentUserId={currentUserId} isGroup={activeChat.isGroup} />
      <MessageInput onSendMessage={handleInterceptSendMessage} disabled={sending} />
    </section>
  );
}
