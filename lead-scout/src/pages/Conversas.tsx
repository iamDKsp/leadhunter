
import { useState, useEffect, useRef } from "react";
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
import { Lead } from "@/types/lead";
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

// Helper to normalize chatId for matching (strips JID suffix and country prefix)
const normalizeChatId = (chatId: string): string => {
    let clean = chatId
        .replace(/@s\.whatsapp\.net$/i, '')
        .replace(/@c\.us$/i, '')
        .replace(/\D/g, '');
    if (clean.startsWith('55') && clean.length > 11) {
        clean = clean.substring(2);
    }
    return clean;
};

const Conversas = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const activeConversationIdRef = useRef<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

    // Check permissions from token
    const token = localStorage.getItem('token');
    let canUseOwnWhatsApp = false;
    let useOwnWhatsApp = false;
    let initialUserId = '';

    if (token) {
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            canUseOwnWhatsApp = decoded.user.permissions?.canUseOwnWhatsApp || false;
            useOwnWhatsApp = decoded.user.useOwnWhatsApp || false;
            initialUserId = decoded.user.id;
        } catch (e) { }
    }

    const { socket } = useWhatsApp();
    const [userId, setUserId] = useState(initialUserId);
    const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('DISCONNECTED');

    // CRM Data
    const [leads, setLeads] = useState<Lead[]>([]);
    const [currentLead, setCurrentLead] = useState<Lead | undefined>(undefined);
    const [showInfoPanel, setShowInfoPanel] = useState(true);

    const toggleInfoPanel = () => setShowInfoPanel(prev => !prev);

    useEffect(() => {
        if (activeConversationId) {
            api.put(`/chat/${activeConversationId}/read`).catch(err => console.error("Failed to mark as read", err));
        }
        fetchConversations();
        fetchTasks();
        fetchLeads();

        // Initial status check
        api.get('/chat/status').then(res => {
            // Logic to determine if we should show connected based on mode
            const status = res.data.status;
            // If we are in personal mode, we might need a specific endpoint or check the session status
            // For now assuming getWhatsAppStatus returns GLOBAL status, which matches default behavior.
            // If personal, we rely on socket 'whatsapp_status' events.
            if (!useOwnWhatsApp) {
                setConnectionStatus(status);
            }
        }).catch(err => console.error("Failed to fetch initial status", err));

    }, []); // Run once on mount

    useEffect(() => {
        // Handle URL parameters for redirection from CRM card click
        const chatIdParam = searchParams.get('chatId');

        if (chatIdParam && conversations.length > 0) {
            // The chat was created by POST /chat/create before navigating here.
            // Just find and select it in the loaded list.
            const exists = conversations.find(c => c.id === chatIdParam);
            if (exists) {
                setActiveConversationId(chatIdParam);
            } else {
                // The conversation list might not have refreshed yet.
                // Refetch conversations then try again.
                fetchConversations().then(() => {
                    setActiveConversationId(chatIdParam);
                });
            }
            // Clean URL params after processing
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, conversations.length]);

    // Keep the ref in sync so socket callbacks can access current value
    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    useEffect(() => {
        if (socket) {
            socket.on('whatsapp_status', (data: any) => {
                console.log("WhatsApp Status Update:", data);

                const targetSessionId = useOwnWhatsApp ? userId : 'GLOBAL';
                const eventSessionId = data.sessionId || 'GLOBAL';

                if (eventSessionId === targetSessionId) {
                    if (data.status === 'CONNECTED' || data.status === 'READY') {
                        setConnectionStatus('CONNECTED');
                        setIsConnectModalOpen(false);
                    } else if (data.status === 'DISCONNECTED') {
                        setConnectionStatus('DISCONNECTED');
                    } else {
                        setConnectionStatus('CONNECTING');
                    }
                }
            });

            socket.on('whatsapp_message', (msg: any) => {
                // Always refresh the conversation sidebar
                fetchConversations();

                // Check if the incoming message belongs to the currently active chat
                const incomingChatId = msg.chatId || msg.from;
                const currentActive = activeConversationIdRef.current;

                if (currentActive) {
                    const normalizedIncoming = normalizeChatId(incomingChatId);
                    const normalizedActive = normalizeChatId(currentActive);

                    if (normalizedIncoming === normalizedActive) {
                        // Re-fetch messages from server for the active chat
                        // This ensures perfect consistency regardless of chatId format
                        fetchMessages(currentActive);
                    }
                }
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

    const fetchLeads = async () => {
        try {
            const res = await api.get('/companies');
            setLeads(res.data);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        }
    };

    const fetchTasks = async () => {
        try {
            // Fetch all tasks for now, filtering can happen here or backend
            const response = await api.get('/personal/tasks');
            const loadedTasks: FollowUp[] = response.data.map((task: any) => {
                let dateObj = new Date(); // Fallback
                try {
                    if (task.dueDate && task.dueDate !== 'Sem prazo') {
                        // Parse "DD/MM, HH:mm" or ISO? 
                        // The backend returns formatted string "DD/MM, HH:mm" or "Hoje, HH:mm"
                        // This makes it hard to parse back to Date object for the scheduler.
                        // Ideally backend should return raw ISO date AND formatted.
                        // For now, let's assume if it comes formatted we might have issues parsing it back 
                        // unless we change backend to return raw.
                        // Let's rely on 'dueDate' from backend being the ISO buffer if we didn't touch it?
                        // actually personalController returns formatted `dueDate`.
                        // We should fix personalController to return raw date or ISO string.
                        // See next step.
                        dateObj = new Date(); // Placeholder
                    }
                } catch (e) { }

                return {
                    id: task.id,
                    leadId: task.companyId || task.id, // Use companyId if available
                    leadName: task.leadName,
                    date: dateObj,
                    time: "00:00",
                    type: task.type || 'call',
                    note: task.title,
                    completed: task.completed
                };
            });
            setFollowUps(loadedTasks);
        } catch (error) {
            console.error("Erro ao buscar tarefas:", error);
        }
    };

    // Load messages when active conversation changes
    useEffect(() => {
        if (activeConversationId) {
            api.put(`/chat/${activeConversationId}/read`).catch(err => console.error("Failed to mark as read", err));
            fetchMessages(activeConversationId);

            // Find associated Lead
            const conversation = conversations.find(c => c.id === activeConversationId);
            if (conversation && conversation.phone) {
                // Normalize phones for comparison (remove non-digits)
                const chatPhone = conversation.phone.replace(/\D/g, '');
                const found = leads.find(l => (l.phone && l.phone.replace(/\D/g, '').includes(chatPhone)) || (l.phone && chatPhone.includes(l.phone.replace(/\D/g, ''))));
                setCurrentLead(found);
            } else {
                setCurrentLead(undefined);
            }
        }
    }, [activeConversationId, conversations, leads]);

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
        try {
            // Optimistic update
            setFollowUps((prev) => [...prev, followUp]);

            // Send to backend
            // Find the lead ID properly. 
            // activeConversationId is often the phone number or JID in this app?
            // If it is a phone number, we need the UUID of the company properly.
            // currentLead should have the real ID.

            const realLeadId = currentLead?.id;

            await api.post('/personal/tasks', {
                companyId: realLeadId, // Linked to the company
                title: followUp.note || `Follow-up: ${followUp.type}`,
                type: followUp.type,
                dueDate: followUp.date, // Scheduler passes Date object
                description: followUp.note
            });

            toast({ title: "Agendado", description: "Tarefa criada com sucesso." });
            fetchTasks(); // Refresh to get server ID
        } catch (error) {
            console.error("Failed to create task", error);
            toast({
                title: "Erro",
                description: "Falha ao criar tarefa.",
                variant: "destructive"
            });
        }
    };

    const handleCompleteFollowUp = async (id: string) => {
        try {
            // Optimistic update
            setFollowUps((prev) =>
                prev.map((f) => (f.id === id ? { ...f, completed: true } : f))
            );

            await api.patch(`/personal/tasks/${id}`, { completed: true });

        } catch (error) {
            console.error("Failed to complete task", error);
            // Revert
            setFollowUps((prev) =>
                prev.map((f) => (f.id === id ? { ...f, completed: false } : f))
            );
        }
    };

    const handleDeleteFollowUp = async (id: string) => {
        try {
            setFollowUps((prev) => prev.filter((f) => f.id !== id));
            await api.delete(`/personal/tasks/${id}`);
        } catch (error) {
            console.error("Failed to delete task", error);
            fetchTasks(); // Revert
        }
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
                            showInfoPanel={showInfoPanel}
                            onToggleInfoPanel={toggleInfoPanel}
                        />
                        {showInfoPanel && (
                            <LeadInfoPanel
                                conversation={activeConversation}
                                lead={currentLead}
                                followUps={followUps}
                                userId={userId}
                                onScheduleFollowUp={() => setIsSchedulerOpen(true)}
                                onCompleteFollowUp={handleCompleteFollowUp}
                                onDeleteFollowUp={handleDeleteFollowUp}
                            />
                        )}
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
                onComplete={handleCompleteFollowUp}
            />

            <WhatsAppConnectModal
                isOpen={isConnectModalOpen}
                onClose={() => setIsConnectModalOpen(false)}
            />
        </div>
    );
};

export default Conversas;
