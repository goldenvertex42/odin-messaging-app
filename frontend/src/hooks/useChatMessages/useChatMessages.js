import { useState, useEffect, useCallback } from 'react';

export function useChatMessages(activeChat) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/conversations/${activeChat.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Unexpected response content-type: ${contentType}`);
        }

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || `Failed to fetch messages (${response.status})`);
        }

        if (!result.success) {
          throw new Error(result.error || 'Server rejected message hydration.');
        }

        if (isMounted) {
          setMessages(result.data.messages || []);
        }
      } catch (err) {
        console.error('Chat messages hydration failure:', err);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [activeChat]);

  const sendMessage = useCallback(async (textContent) => {
    if (!activeChat) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/conversations/${activeChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: textContent })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        // 1. Update the chat window bubbles locally
        setMessages((prev) => [...prev, result.data]);
        return result.data; // Return the new message data for potential further use
        
        // 2. Trigger the callback to instantly push the snippet to the sidebar list
        if (onNewMessageSent) {
          onNewMessageSent(result.data);
        }
      }
    } catch (err) {
      console.error('Chat message send failure:', err);
    } finally {
      setSending(false);
    }
  }, [activeChat]);


  return {
    messages,
    sending,
    sendMessage
  };
}
