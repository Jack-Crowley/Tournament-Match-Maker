import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MessagePopup } from '@/components/message-popup';

type Message = {
    id: number;
    message: string;
    color: 'green' | 'red' | 'blue' | 'yellow';
};

type MessageContextType = {
    triggerMessage: (message: string, color: 'green' | 'red' | 'blue' | 'yellow') => void;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<Message[]>([]);

    const triggerMessage = (message: string, color: 'green' | 'red' | 'blue' | 'yellow') => {
        const id = Date.now();
        setMessages(prevMessages => [{ id, message, color}, ...prevMessages]);

        setTimeout(() => {
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== id));
        }, 5000);
    };

    return (
        <MessageContext.Provider value={{ triggerMessage }}>
            <Messages messages={messages} />
            {children}
        </MessageContext.Provider>
    );
};

export const useMessage = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessage must be used within a MessageProvider');
    }
    return context;
};

const Messages: React.FC<{ messages: Message[] }> = ({ messages }) => (
    <div style={{
        position: "fixed",
        top: "10px",
        width: "100%",
        zIndex: 1000
    }}>
        {messages.map((message, index) => (
            <MessagePopup key={message.id} color={message.color} index={index}>
                {message.message}
            </MessagePopup>
        ))}
    </div>
);