import { MessageSquare } from "lucide-react";

export const EmptyState = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm p-8 text-center animate-fade-in">
            <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
                Sua Central de Conversas
            </h2>
            <p className="text-muted-foreground max-w-sm mb-6">
                Selecione uma conversa ao lado para visualizar mensagens, agendar follow-ups e gerenciar seus leads.
            </p>
        </div>
    );
};
