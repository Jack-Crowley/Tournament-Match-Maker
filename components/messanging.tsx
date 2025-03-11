"use client"

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { SpinningLoader } from './loading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faPaperPlane, faUserCircle,
    faChevronLeft, faTimes, faPlus
} from '@fortawesome/free-solid-svg-icons';
import { User } from '@/types/userType';
import { TournamentPlayer } from '@/types/playerTypes';

interface Message {
    id: number;
    timestamp: string;
    player_uuid: string;
    tournament_id: number;
    content: string;
    player_seen: boolean;
    admin_seen: boolean;
    admin_sent: boolean;
}

interface Chat {
    id: number;
    player_uuid: string;
    player_name: string;
    lastMessage?: Message;
    unreadCount: number;
    messages: Message[];
}

export const MessagingSystem = ({ tournamentID, user }: { tournamentID: number, user: User }) => {
    const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [players, setPlayers] = useState<TournamentPlayer[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<number>(-1);
    const [newMessage, setNewMessage] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
    const [searchResults, setSearchResults] = useState<TournamentPlayer[]>([]);
    const [isMobileView, setIsMobileView] = useState<boolean>(false);
    const [showChatList, setShowChatList] = useState<boolean>(true);

    const messageEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const supabase = createClient();

    useEffect(() => {
        if (user) {
            setIsAdmin(["admin", "owner"].includes(user.permission_level));
        }
    }, [user]);

    // Check for mobile view
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (selectedChat>=0 && selectedChat < chats.length && messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChat]);

    function createChatsFromMessages(messages: Message[], players: TournamentPlayer[]) {
        const playerNameMap: { [key: string]: string } = {};
        players.forEach(player => {
            playerNameMap[player.member_uuid] = player.player_name;
        });

        const groupedMessages: { [key: string]: Message[] } = {};

        messages.forEach(message => {
            if (!groupedMessages[message.player_uuid]) {
                groupedMessages[message.player_uuid] = [];
            }
            groupedMessages[message.player_uuid].push(message);
        });

        const chats: Chat[] = Object.keys(groupedMessages).map((player_uuid, index) => {
            const messagesForPlayer = groupedMessages[player_uuid];

            // Count unread messages based on role
            const unreadCount = isAdmin 
                ? messagesForPlayer.filter(message => !message.admin_seen && !message.admin_sent).length
                : messagesForPlayer.filter(message => !message.player_seen && message.admin_sent).length;

            // Sort messages by timestamp 
            messagesForPlayer.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            const lastMessage = messagesForPlayer.length > 0 
                ? messagesForPlayer[messagesForPlayer.length - 1] 
                : undefined;

            const player_name = playerNameMap[player_uuid] || 'Unknown Player';

            return {
                id: index,
                player_uuid,
                lastMessage,
                unreadCount,
                player_name,
                messages: messagesForPlayer,
            };
        });

        // Sort chats by most recent message
        chats.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
        });

        return chats;
    }

    // Initial loading of chats
    useEffect(() => {
        async function loadChats() {
            if (isAdmin === undefined) return;

            const { data: players } = await supabase
                .from("tournament_players")
                .select("*")
                .eq("tournament_id", tournamentID);

            if (!players) return;

            setPlayers(players);

            if (isAdmin) {
                const { data: messageData } = await supabase
                    .from("private_messages")
                    .select("*")
                    .eq("tournament_id", tournamentID);

                if (!messageData) return;

                const messages: Message[] = messageData as Message[];
                const chats: Chat[] = createChatsFromMessages(messages, players);
                setChats(chats);
            } else {
                const { data: messageData } = await supabase
                    .from("private_messages")
                    .select("*")
                    .eq("tournament_id", tournamentID)
                    .eq("player_uuid", user.uuid);
                
                if (!messageData) return;

                const messages: Message[] = messageData as Message[];
                const chats: Chat[] = createChatsFromMessages(messages, players);

                if (chats.length === 0) {
                    chats.push({
                        id: 0,
                        player_uuid: user.uuid,
                        player_name: players.find(player => player.member_uuid === user.uuid)?.player_name || 'Unknown Player',
                        unreadCount: 0,
                        messages: []
                    });
                }

                setChats(chats);
            }

            setLoading(false);
        }

        loadChats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, tournamentID, user?.uuid, supabase]);

    const [numberOfMessagesInChat, setNumberOfMessagesInChat] = useState<number>(0)

    useEffect(() => {
        if (chats && selectedChat >= 0 && selectedChat < chats.length) {
            if (chats[selectedChat].messages.length != numberOfMessagesInChat) {
                setNumberOfMessagesInChat(chats[selectedChat].messages.length)
                if (messageEndRef && messageEndRef.current) {
                    messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chats, selectedChat])

    useEffect(() => {
        if (isAdmin === undefined || selectedChat == -1) return;

        const messageChannel = supabase
            .channel('private_messages_channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'private_messages',
                filter: `tournament_id=eq.${tournamentID}${!isAdmin ? `&player_uuid=eq.${user.uuid}` : ''}`,
            }, (payload) => {
                const newMessage = payload.new as Message;
                
                if (selectedChat>=0 && chats[selectedChat].player_uuid === newMessage.player_uuid) {
                    if (isAdmin && !newMessage.admin_sent) {
                        markMessageAsSeen(newMessage.id, true);
                    } else if (!isAdmin && newMessage.admin_sent) {
                        markMessageAsSeen(newMessage.id, false);
                    }
                }

                setChats(prevChats => {
                    const chatIndex = prevChats.findIndex(chat => chat.player_uuid === newMessage.player_uuid);
                    if (chatIndex >= 0) {
                        const updatedChats = [...prevChats];
                        const chat = {...updatedChats[chatIndex]};
                        
                        chat.messages = [...chat.messages, newMessage];
                        chat.lastMessage = newMessage;
                        
                        if (selectedChat == -1 || chats[selectedChat].player_uuid !== chat.player_uuid) {
                            if (isAdmin && !newMessage.admin_sent) {
                                chat.unreadCount += 1;
                            } else if (!isAdmin && newMessage.admin_sent) {
                                chat.unreadCount += 1;
                            }
                        }
                        
                        updatedChats[chatIndex] = chat;
                        
                        return updatedChats.sort((a, b) => {
                            if (!a.lastMessage) return 1;
                            if (!b.lastMessage) return -1;
                            return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
                        });
                    } else {
                        const playerName = players.find(p => p.member_uuid === newMessage.player_uuid)?.player_name || 'Unknown Player';
                        
                        const newChat: Chat = {
                            id: prevChats.length,
                            player_uuid: newMessage.player_uuid,
                            player_name: playerName,
                            messages: [newMessage],
                            lastMessage: newMessage,
                            unreadCount: 1
                        };
                        
                        return [newChat, ...prevChats];
                    }
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'private_messages',
                filter: `tournament_id=eq.${tournamentID}${!isAdmin ? `&player_uuid=eq.${user.uuid}` : ''}`,
            }, (payload) => {
                const updatedMessage = payload.new as Message;
                
                setChats(prevChats => {
                    const chatIndex = prevChats.findIndex(chat => chat.player_uuid === updatedMessage.player_uuid);
                    
                    if (chatIndex >= 0) {
                        const updatedChats = [...prevChats];
                        const chat = {...updatedChats[chatIndex]};
                        
                        chat.messages = chat.messages.map(msg => 
                            msg.id === updatedMessage.id ? updatedMessage : msg
                        );
                        
                        if (chat.lastMessage && chat.lastMessage.id === updatedMessage.id) {
                            chat.lastMessage = updatedMessage;
                        }
                        
                        chat.unreadCount = isAdmin 
                            ? chat.messages.filter(message => !message.admin_seen && !message.admin_sent).length
                            : chat.messages.filter(message => !message.player_seen && message.admin_sent).length;
                            
                        updatedChats[chatIndex] = chat;
                        return updatedChats;
                    }
                    
                    return prevChats;
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(messageChannel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, selectedChat, tournamentID, user?.uuid, players, supabase]);

    // Mark messages as seen when chat is selected
    useEffect(() => {
        if (selectedChat>=0 && chats[selectedChat].messages.length > 0) {
            markChatAsSeen(chats[selectedChat]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChat]);

    const markChatAsSeen = async (chat: Chat) => {
        if (isAdmin === undefined) return;
        
        const unreadMessages = chat.messages.filter(msg => 
            isAdmin ? (!msg.admin_seen && !msg.admin_sent) : (!msg.player_seen && msg.admin_sent)
        );
        
        if (unreadMessages.length > 0) {
            setChats(prevChats => {
                const chatIndex = prevChats.findIndex(c => c.player_uuid === chat.player_uuid);
                if (chatIndex >= 0) {
                    const updatedChats = [...prevChats];
                    const updatedChat = {...updatedChats[chatIndex]};
                    
                    updatedChat.messages = updatedChat.messages.map(msg => {
                        if (isAdmin && !msg.admin_seen && !msg.admin_sent) {
                            return {...msg, admin_seen: true};
                        } else if (!isAdmin && !msg.player_seen && msg.admin_sent) {
                            return {...msg, player_seen: true};
                        }
                        return msg;
                    });
                    
                    updatedChat.unreadCount = 0;
                    updatedChats[chatIndex] = updatedChat;
                    return updatedChats;
                }
                return prevChats;
            });
            
            // Update in database
            const updates = unreadMessages.map(msg => ({
                id: msg.id,
                [isAdmin ? 'admin_seen' : 'player_seen']: true
            }));
            
            for (const update of updates) {
                await supabase
                    .from('private_messages')
                    .update(update)
                    .eq('id', update.id);
            }
        }
    };

    const markMessageAsSeen = async (messageId: number, isAdminViewing: boolean) => {
        const update = isAdminViewing 
            ? { admin_seen: true } 
            : { player_seen: true };
            
        await supabase
            .from('private_messages')
            .update(update)
            .eq('id', messageId);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || selectedChat==-1 || isAdmin === undefined) return;

        const newMsg = {
            player_uuid: chats[selectedChat].player_uuid,
            tournament_id: tournamentID,
            content: newMessage.trim(),
            player_seen: !isAdmin,
            admin_seen: isAdmin,
            admin_sent: isAdmin
        };

        await supabase.from("private_messages").insert(newMsg);
        setNewMessage('');
    };

    const handleSearchUsers = (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) {
            const filtered = players.filter(user =>
                user.player_name.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    };

    const handleCreateChat = (player: TournamentPlayer) => {
        const existingChat = chats.findIndex(chat =>
            chat.player_uuid === player.member_uuid
        );

        if (existingChat) {
            setSelectedChat(existingChat);
        } else {
            const newChat: Chat = {
                id: chats.length,
                player_uuid: player.member_uuid,
                player_name: player.player_name,
                unreadCount: 0,
                messages: []
            };

            setChats(prev => [newChat, ...prev]);
            setSelectedChat(newChat.id);
        }

        setShowNewChatModal(false);
        setSearchQuery('');
        setSearchResults([]);
        
        if (isMobileView) {
            setShowChatList(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleChatSelect = (chatIndex : number) => {
        setSelectedChat(chatIndex);
        if (isMobileView) {
            setShowChatList(false);
        }
    };

    if (loading) {
        return <SpinningLoader />;
    }

    return (
        <div className="relative min-h-screen py-10 px-4 md:px-8" style={{ backgroundColor: "#160A3A" }}>
            <div className="max-w-6xl mx-auto bg-[#1F1346] rounded-2xl shadow-2xl overflow-hidden">
                <div className="relative px-6 pt-8 pb-4 md:px-10 flex justify-between items-center">
                    <h1 className="text-[#7458da] font-bold text-3xl md:text-4xl">
                        Messages
                    </h1>
                </div>

                <div className="flex flex-col md:flex-row h-[70vh]">
                    <AnimatePresence>
                        {(showChatList || !isMobileView) && (
                            <motion.div
                                initial={isMobileView ? { x: -300, opacity: 0 } : undefined}
                                animate={{ x: 0, opacity: 1 }}
                                exit={isMobileView ? { x: -300, opacity: 0 } : undefined}
                                className="w-full md:w-1/3 border-r border-[#2a1a66] bg-[#1F1346]"
                            >
                                <div className="p-4 border-b border-[#2a1a66] flex justify-between items-center">
                                    <h2 className="text-[#7458da] font-semibold">Conversations</h2>
                                    {isAdmin && (
                                        <button
                                            onClick={() => setShowNewChatModal(true)}
                                            className="bg-[#7458da] hover:bg-[#604BAC] text-white rounded-full p-2"
                                            title="New Message"
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-y-auto h-full pb-20">
                                    <AnimatePresence>
                                        {chats.map((chat, ind) => (
                                            <motion.div
                                                key={chat.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                whileHover={{ scale: 1.01 }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 500,
                                                    damping: 30
                                                }}
                                                onClick={() => handleChatSelect(ind)}
                                                className={`p-4 cursor-pointer border-b border-[#2a1a66] ${
                                                    (selectedChat >= 0 && chats[selectedChat].id === chat.id)
                                                        ? 'bg-[#3b2682]'
                                                        : 'hover:bg-[#2a1a66]'
                                                }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-[#7458da] flex items-center justify-center text-white">
                                                        <FontAwesomeIcon icon={faUserCircle} size="lg" />
                                                    </div>

                                                    <div className="ml-3 flex-1">
                                                        <div className="flex justify-between items-center">
                                                            <h3 className="text-white font-medium">{isAdmin ? chat.player_name : "Organizers"}</h3>
                                                            {chat.lastMessage && (
                                                                <span className="text-xs text-gray-400">
                                                                    {formatDate(chat.lastMessage.timestamp)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-between items-center mt-1">
                                                            <p className="text-sm text-gray-300 truncate max-w-[170px]">
                                                                {chat.lastMessage
                                                                    ? `${(chat.lastMessage.admin_sent && isAdmin) || 
                                                                       !(chat.lastMessage.admin_sent || isAdmin) ? 'You: ' : ''}${chat.lastMessage.content}`
                                                                    : 'No messages yet'
                                                                }
                                                            </p>

                                                            {chat.unreadCount > 0 && (
                                                                <span className="bg-[#7458da] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                                    {chat.unreadCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {chats.length === 0 && (
                                        <div className="p-6 text-center text-gray-400">
                                            <p>No conversations yet</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 flex flex-col bg-[#2a1a66] relative">
                        {selectedChat >= 0 ? (
                            <>
                                <div className="p-4 border-b border-[#3b2682] flex items-center">
                                    {isMobileView && (
                                        <button
                                            onClick={() => {
                                                setShowChatList(true);
                                                if (isMobileView) setSelectedChat(-1);
                                            }}
                                            className="text-gray-300 mr-3"
                                        >
                                            <FontAwesomeIcon icon={faChevronLeft} />
                                        </button>
                                    )}
                                    <div className="flex-1 flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-[#7458da] flex items-center justify-center text-white">
                                            <FontAwesomeIcon icon={faUserCircle} />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-white font-medium">
                                                {isAdmin ? chats[selectedChat].player_name : "Organizers"}
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    {chats[selectedChat].messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                            <div className="w-16 h-16 rounded-full bg-[#1F1346] flex items-center justify-center text-[#7458da] mb-4">
                                                <FontAwesomeIcon icon={faPaperPlane} size="lg" />
                                            </div>
                                            <h3 className="text-white font-medium mb-2">Start a new conversation</h3>
                                            <p className="text-sm text-gray-400">
                                                Send your first message to {isAdmin ? chats[selectedChat].player_name : "Tournament Organizers"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {chats[selectedChat].messages.map((message, index) => {
                                                const isCurrentUser = (message.admin_sent && isAdmin) || !(message.admin_sent || isAdmin);
                                                const showDate = index === 0 ||
                                                    formatDate(message.timestamp) !== formatDate(chats[selectedChat].messages[index - 1].timestamp);

                                                return (
                                                    <div key={message.id}>
                                                        {showDate && (
                                                            <div className="text-center my-4">
                                                                <span className="bg-[#1F1346] text-gray-400 text-xs px-3 py-1 rounded-full">
                                                                    {formatDate(message.timestamp)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                                                    isCurrentUser
                                                                        ? 'bg-[#7458da] text-white rounded-br-none'
                                                                        : 'bg-[#3b2682] text-white rounded-bl-none'
                                                                }`}
                                                            >
                                                                <p>{message.content}</p>
                                                                <div className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-200' : 'text-gray-400'}`}>
                                                                    {formatTime(message.timestamp)}
                                                                </div>
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messageEndRef} />
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-[#3b2682]">
                                    <div className="flex items-center bg-[#1F1346] rounded-lg p-2">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            ref={inputRef}
                                            className="flex-1 bg-transparent text-white focus:outline-none px-2"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            className={`ml-2 text-white p-2 rounded-full ${
                                                newMessage.trim()
                                                    ? 'bg-[#7458da] hover:bg-[#604BAC]'
                                                    : 'bg-[#3b2682] cursor-not-allowed'
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <div className="w-16 h-16 rounded-full bg-[#1F1346] flex items-center justify-center text-[#7458da] mb-4">
                                    <FontAwesomeIcon icon={faPaperPlane} size="lg" />
                                </div>
                                <h3 className="text-white font-medium mb-2">Select a conversation</h3>
                                <p className="text-sm text-gray-400">
                                    Choose from your existing conversations or start a new one
                                </p>
                                {isAdmin && (
                                    <button
                                        onClick={() => setShowNewChatModal(true)}
                                        className="mt-6 bg-[#7458da] hover:bg-[#604BAC] text-white px-4 py-2 rounded-lg"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                        New Conversation
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* New Chat Modal */}
            <AnimatePresence>
                {showNewChatModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1F1346] rounded-xl w-full max-w-md p-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl text-[#7458da] font-bold">New Conversation</h2>
                                <button
                                    onClick={() => {
                                        setShowNewChatModal(false);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name or email"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    className="w-full pl-10 p-3 rounded-lg bg-[#2a1a66] text-white focus:outline-none focus:ring-2 focus:ring-[#7458da]"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    searchResults.map((user) =>
                                        <div
                                            key={user.id}
                                            onClick={() => handleCreateChat(user)}
                                            className="p-3 hover:bg-[#2a1a66] rounded-lg cursor-pointer transition-colors flex items-center"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#7458da] flex items-center justify-center text-white">
                                                <FontAwesomeIcon icon={faUserCircle} />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-white font-medium">{user.player_name}</h3>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    searchQuery.length > 2 ? (
                                        <p className="text-center py-4 text-gray-400">No users found</p>
                                    ) : (
                                        <p className="text-center py-4 text-gray-400">
                                            Type at least 3 characters to search
                                        </p>
                                    )
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};