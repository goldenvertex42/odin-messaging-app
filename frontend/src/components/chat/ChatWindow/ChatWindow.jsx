import { useChatMessages } from '../../../hooks/useChatMessages/useChatMessages';
import ChatHeader from './components/ChatHeader/ChatHeader';
import MessageList from './components/MessageList/MessageList';
import MessageInput from './components/MessageInput/MessageInput';
import styles from './ChatWindow.module.css';

export default function ChatWindow({ activeChat, currentUserId, onNewMessageSent }) {
  const { messages, sending, sendMessage } = useChatMessages(activeChat);

  // 🎯 INTERCEPTOR: Fires when the user hits send inside the MessageInput component
  const handleInterceptSendMessage = async (textContent) => {
    // 1. Fire your hook logic and capture the returned JSON object row from the backend
    const newlyCreatedMessage = await sendMessage(textContent);

    // 2. Forward that fresh data object up to the parent ConversationsPage layout
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

  return (
    <section className={styles.window} data-testid="chat-window-container">
      <ChatHeader title={activeChat.name} />
      
      <MessageList 
        messages={messages} 
        currentUserId={currentUserId} 
        isGroup={activeChat.isGroup} 
      />
      
      {/* ✅ Pass your interceptor down instead of the raw isolated hook handler */}
      <MessageInput 
        onSendMessage={handleInterceptSendMessage} 
        disabled={sending} 
      />
    </section>
  );
}
