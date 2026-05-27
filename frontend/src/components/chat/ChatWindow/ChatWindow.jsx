import { useChatMessages } from '../../../hooks/useChatMessages/useChatMessages';
import ChatHeader from './components/ChatHeader/ChatHeader';
import MessageList from './components/MessageList/MessageList';
import MessageInput from './components/MessageInput/MessageInput';
import styles from './ChatWindow.module.css';

export default function ChatWindow({ activeChat, currentUserId }) {
  const { messages, sending, sendMessage } = useChatMessages(activeChat);

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
      <MessageList messages={messages} currentUserId={currentUserId} isGroup={activeChat.isGroup} />
      <MessageInput onSendMessage={sendMessage} disabled={sending} />
    </section>
  );
}
