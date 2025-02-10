import { createClient } from '@/utils/supabase/client';

import { useState, useEffect } from "react";

export default function Messages(): JSX.Element {
    const supabase = createClient();

    const [newMessages, setMessages] = useState([]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                // Get the current user
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;

                const userId = user?.id;

                // Fetch messages from the "messages" table
                const { data: messages, error: messagesError } = await supabase
                    .from('announcements')
                    .select('*');

                if (messagesError) {
                    throw messagesError
                };

                const transformedMessages = messages.map((message) => ({
                    ...message,
                    seen: message.seen.includes(userId),
                }));

                // Set messages in state
                setMessages(transformedMessages as any);


                // Add the user's ID to the 'seen' array for all new messages
                const updates = messages.map(async (message) => {
                    if (!message.seen.includes(userId)) {
                        const updatedSeenArray = [...message.seen, userId];

                        // Update the message in the database
                        const { error: updateError } = await supabase
                            .from('announcements')
                            .update({ seen: updatedSeenArray })
                            .eq('id', message.id);

                        if (updateError) {
                            console.error(`Failed to update message with ID ${message.id}`, updateError);
                        }
                    }
                });

                // Wait for all updates to complete
                await Promise.all(updates);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();
    }, []);


    const [newMessage, setNewMessage] = useState('');


    const handleSend = async () => {
        try {
            // Get the current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            const userName = user?.user_metadata.name;

            // Create a new message object
            const newMessageObj = {
                id: Date.now(), // Temporary ID for local usage
                sender: userName,
                message: newMessage,
                seen: false, // New message is unseen by other users
            };

            // Update state locally
            setMessages((prevMessages): any => [...prevMessages, newMessageObj]);

            // Insert the message into the database
            const { error: dbError } = await supabase.from("announcements").insert({
                message: newMessage,
                sender: userName,
                seen: [],
            });

            if (dbError) {
                console.error("Error saving message to the database:", dbError);
            } else {
                setNewMessage("");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="text-white">
            <h2 className="text-lg font-semibold mb-4">Messages</h2>
            <div className="bg-[#604BAC] p-4 rounded-lg space-y-4">
                {newMessages.map((message: any) => (
                    <div key={message.id} className="p-3 bg-[#7e67d2] rounded-lg">
                        <p className={`font-semibold ${!message.seen ? "text-[#dddd4c]" : ""} font-bold`}>{message.sender}</p>
                        <p className="text-sm">{message.message}</p>
                    </div>
                ))}
            </div>

            {/* Input and Send Button */}
            <div className="mt-6 flex">
                <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-l-lg border-2 border-[#3c325f] text-black focus:outline-none border-r-0"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                    onClick={handleSend}
                    className="px-4 py-2 bg-[#7e67d2] text-white rounded-r-lg border-2 border-[#3c325f] border-l-4 hover:bg-[#604BAC] focus:outline-none transition duration-200"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
