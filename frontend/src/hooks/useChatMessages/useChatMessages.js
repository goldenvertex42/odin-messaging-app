import { useState, useEffect, useCallback } from 'react';

export function useChatMessages(activeChat, onNewMessageSent) {
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
        const response = await fetch(`/api/conversations/${activeChat.id}`, {
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

  const sendMessage = useCallback(async (textContent, fileAttachment = null) => {
    if (!activeChat) return;
    setSending(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      
      if (textContent && textContent.trim() !== '') {
        formData.append('content', textContent);
      }
      
      if (fileAttachment) {
        formData.append('image', fileAttachment);
      }

      const response = await fetch(`/api/conversations/${activeChat.id}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }, 
        body: formData
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update the chat window bubbles locally with the new text or file Url parameters
        setMessages((prev) => [...prev, result.data]);
        
        // Trigger the callback to instantly push the snippet to the sidebar list
        if (onNewMessageSent) {
          onNewMessageSent(result.data);
        }
        
        return result.data; 
      }
    } catch (err) {
      console.error('Chat message send failure:', err);
    } finally {
      setSending(false);
    }
  }, [activeChat, onNewMessageSent]);



  return {
    messages,
    sending,
    sendMessage
  };
}
