import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import './ChatOverlay.css';

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}

interface ChatOverlayProps {
  worldId: string;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ worldId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3002', {
      query: { worldId }
    });

    newSocket.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [worldId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (inputText.trim() && socket) {
      const message: Message = {
        id: Date.now().toString(),
        user: 'User',
        text: inputText,
        timestamp: new Date()
      };
      
      socket.emit('message', message);
      setInputText('');
    }
  };

  return (
    <div className="chat-overlay glassmorphism-dark">
      <div className="chat-header">
        <h3>World Chat</h3>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message">
            <span className="message-user">{msg.user}:</span>
            <span className="message-text">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-wrapper">
        <input
          type="text"
          className="input-glass"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button className="btn-primary" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatOverlay;