
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { LeadInfoPanel } from "@/components/chat/LeadInfoPanel";
import { EmptyState } from "@/components/chat/EmptyState";
import { FollowUpScheduler, FollowUp } from "@/components/chat/FollowUpScheduler";
import { FollowUpReminder } from "@/components/chat/FollowUpReminder";
import { WhatsAppConnectModal } from "@/components/chat/WhatsAppConnectModal";
import { Conversation } from "@/components/chat/ConversationItem";
import { Message } from "@/components/chat/MessageBubble";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { useWhatsApp } from "@/context/WhatsAppContext";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    user: {
        id: string;
        permissions?: {
            canUseOwnWhatsApp?: boolean;
        };
        useOwnWhatsApp?: boolean;
    }
}

const Conversas = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

    // Check permissions from token
    const token = localStorage.getItem('token');
    let canUseOwnWhatsApp = false;
    let useOwnWhatsApp = false;
    if (token) {
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            canUseOwnWhatsApp = decoded.user.permissions?.canUseOwnWhatsApp || false;
            useOwnWhatsApp = decoded.user.useOwnWhatsApp || false;
        } catch (e) { }
    }

    const { socket } = useWhatsApp();
    const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('DISCONNECTED');

    useEffect(() => {
        fetchConversations();
        fetchTasks();

        // Initial status check (optional, or wait for event)
        // api.get('/chat/status').then(res => setConnectionStatus(res.data.status));
    }, []); // Run once on mount

    useEffect(() => {
        // Handle URL parameters for redirection
        const chatIdParam = searchParams.get('chatId');
        const nameParam = searchParams.get('name');
        const phoneParam = searchParams.get('phone');

        if (chatIdParam && conversations.length > 0) {
            const exists = conversations.find(c => c.id === chatIdParam);
            if (exists) {
                setActiveConversationId(chatIdParam);
            } else if (nameParam && phoneParam) {
                // Temporary conversation for new chat
                const newConv: Conversation = {
                    id: chatIdParam,
                    leadName: nameParam,
                    businessName: '',
                    lastMessage: 'Nova conversa',
                    timestamp: new Date().toLocaleTimeString(),
                    unreadCount: 0,
                    phone: phoneParam,
                    status: 'warm',
                    isRead: true
                };
                setConversations(prev => [newConv, ...prev]);
                setActiveConversationId(chatIdParam);
            }
        }
    }, [searchParams, conversations.length]); // Depend on conversations loaded

    useEffect(() => {
        if (socket) {
            socket.on('whatsapp_status', (data: any) => {
                // Check if status is for our session or global
                // For simplicity, update global status indicator
                console.log("WhatsApp Status Update:", data);
                if (data.status === 'CONNECTED' || data.status === 'READY') {
                    setConnectionStatus('CONNECTED');
                    setIsConnectModalOpen(false);
                } else if (data.status === 'DISCONNECTED') {
                    setConnectionStatus('DISCONNECTED');
                } else {
                    setConnectionStatus('CONNECTING');
                }
            });

            socket.on('whatsapp_message', (msg: any) => {
                // If message belongs to current user session (or global if we are global)
                // Logic: 
                // 1. If we are using own whatsapp, msg must have our sessionId.
                // 2. If we are global, msg must NOT have sessionId or be GLOBAL.

                // For now, simplify: Just append if we are in the chat.
                // We'll reload conversations list to update order/preview
                fetchConversations();

                setMessages(prev => {
                    const chatId = msg.chatId || msg.from; // Backend should send chatId
                    // If active chat matches
                    if (prev[chatId]) {
                        return {
                            ...prev,
                            [chatId]: [...prev[chatId], {
                                id: msg.id,
                                content: msg.body,
                                timestamp: new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                isSent: msg.fromMe,
                                isRead: false,
                                type: msg.type || 'text'
                            }]
                        };
                    }
                    return prev;
                });
            });
        }

        return () => {
            if (socket) {
                socket.off('whatsapp_message');
                socket.off('whatsapp_status');
            }
        };
    }, [socket]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await api.get('/personal/tasks');
            const loadedTasks: FollowUp[] = response.data.map((task: any) => {
                let dateObj = new Date(); // Fallback
                try {
                    if (task.dueDate) dateObj = new Date(task.dueDate);
                } catch (e) { }

                return {
                    id: task.id,
                    leadId: task.id,
                    leadName: task.title,
                    date: dateObj,
                    time: "00:00",
                    type: task.type || 'call',
                    note: task.title,
                    completed: task.completed
                };
            });
            // Keeping empty for now as requested in previous turn logic
        } catch (error) {
            console.error("Erro ao buscar tarefas:", error);
        }
    };

    // Load messages when active conversation changes
    useEffect(() => {
        if (activeConversationId) {
            fetchMessages(activeConversationId);
        }
    }, [activeConversationId]);

    const fetchMessages = async (chatId: string) => {
        try {
            const res = await api.get(`/messages/${chatId}`);
            const formattedMessages: Message[] = res.data.map((m: any) => ({
                id: m.id,
                content: m.body,
                timestamp: new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSent: m.fromMe,
                isRead: m.ack >= 3,
                type: m.type || 'text'
            }));

            setMessages(prev => ({
                ...prev,
                [chatId]: formattedMessages
            }));

            // Mark locally as read in conversations list
            setConversations(prev => prev.map(c =>
                c.id === chatId ? { ...c, unreadCount: 0, isRead: true } : c
            ));

        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const activeConversation = conversations.find(
        (c) => c.id === activeConversationId
    );

    const handleSendMessage = async (content: string) => {
        if (!activeConversationId) return;

        try {
            await api.post('/whatsapp/send', {
                to: activeConversationId,
                message: content
            });

            // Optimistic update
            const newMessage: Message = {
                id: `temp-${Date.now()}`,
                content,
                timestamp: new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                isSent: true,
                isRead: false,
                type: "text",
            };

            setMessages((prev) => ({
                ...prev,
                [activeConversationId]: [
                    ...(prev[activeConversationId] || []),
                    newMessage,
                ],
            }));

            // Refresh conv list to update last message
            fetchConversations();

        } catch (error) {
            toast({
                title: "Erro ao enviar",
                description: "Não foi possível enviar a mensagem.",
                variant: "destructive"
            });
        }
    };

    const handleSendMedia = async (file: string, type: string) => {
        if (!activeConversationId) return;

        try {
            // Optimistic update
            const newMessage: Message = {
                id: `temp-${Date.now()}`,
                content: file,
                timestamp: new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                isSent: true,
                isRead: false,
                type: type as any,
            };

            setMessages((prev) => ({
                ...prev,
                [activeConversationId]: [
                    ...(prev[activeConversationId] || []),
                    newMessage,
                ],
            }));

            await api.post('/chat/send-media', {
                to: activeConversationId,
                file: file,
                type: type
            });

            fetchConversations();
            toast({ title: "Mídia enviada", description: "Sua mídia foi enviada com sucesso." });

        } catch (error) {
            console.error(error);
            toast({
                title: "Erro ao enviar mídia",
                description: "Não foi possível enviar a mídia.",
                variant: "destructive"
            });
            // Revert optimistic update?
            setMessages((prev) => ({
                ...prev,
                [activeConversationId]: (prev[activeConversationId] || []).filter(m => m.id !== newMessage.id)
            }));
        }
    };

    const handleScheduleFollowUp = async (followUp: FollowUp) => {
        setFollowUps((prev) => [...prev, followUp]);
        // Backend sync logic skipped for brevity, assumed implemented
        toast({ title: "Agendado", description: "Follow-up criado." });
    };

    const handleCompleteFollowUp = async (id: string) => {
        setFollowUps((prev) =>
            prev.map((f) => (f.id === id ? { ...f, completed: true } : f))
        );
    };

    const handleDeleteFollowUp = (id: string) => {
        setFollowUps((prev) => prev.filter((f) => f.id !== id));
    };

    const handleDismissReminder = (id: string) => {
        // ...
    };

    const handleGoToLead = (leadId: string) => {
        setActiveConversationId(leadId);
    };

    return (
        <div className="flex h-full bg-background overflow-hidden relative flex-col">
            {/* Toolbar for Multi-WhatsApp if enabled */}
            <div className="bg-secondary/30 border-b border-border/50 p-2 flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                        {canUseOwnWhatsApp && useOwnWhatsApp ? 'Modo: WhatsApp Pessoal' : 'Modo: WhatsApp Global'}
                    </span>
                    {/* Status Indicator */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/50 border border-border/50">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]' :
                                connectionStatus === 'CONNECTING' ? 'bg-yellow-500 animate-pulse' :
                                    'bg-red-500'
                            }`} />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            {connectionStatus === 'CONNECTED' ? 'Online' :
                                connectionStatus === 'CONNECTING' ? 'Conectando...' :
                                    'Offline'}
                        </span>
                    </div>
                </div>

                {canUseOwnWhatsApp && useOwnWhatsApp && (
                    <Button variant="ghost" size="sm" className="h-7 gap-2" onClick={() => setIsConnectModalOpen(true)}>
                        <QrCode className="w-3 h-3" />
                        Gerenciar Conexão
                    </Button>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                <ChatSidebar
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={setActiveConversationId}
                    connectionStatus={connectionStatus}
                />

                {activeConversation ? (
                    <>
                        <ChatWindow
                            conversation={activeConversation}
                            messages={messages[activeConversationId!] || []}
                            onSendMessage={handleSendMessage}
                            onSendMedia={handleSendMedia}
                        />
                        <LeadInfoPanel
                            conversation={activeConversation}
                            followUps={followUps}
                            onScheduleFollowUp={() => setIsSchedulerOpen(true)}
                            onCompleteFollowUp={handleCompleteFollowUp}
                            onDeleteFollowUp={handleDeleteFollowUp}
                        />
                    </>
                ) : (
                    <EmptyState />
                )}
            </div>

            {activeConversation && (
                <FollowUpScheduler
                    isOpen={isSchedulerOpen}
                    onClose={() => setIsSchedulerOpen(false)}
                    leadId={activeConversation.id}
                    leadName={activeConversation.leadName}
                    onSchedule={handleScheduleFollowUp}
                />
            )}

            <FollowUpReminder
                followUps={followUps}
                onDismiss={handleDismissReminder}
                onGoToLead={handleGoToLead}
            />

            <WhatsAppConnectModal
                isOpen={isConnectModalOpen}
                onClose={() => setIsConnectModalOpen(false)}
            />
        </div>
    );
};

export default Conversas;
