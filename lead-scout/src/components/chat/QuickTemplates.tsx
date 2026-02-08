import { useState } from "react";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickTemplatesProps {
    onSelectTemplate: (template: string) => void;
}

const templates = [
    {
        id: "1",
        title: "Apresentação",
        content: "Olá! Tudo bem? Vi que você tem interesse em nossos serviços. Posso te ajudar com mais informações?",
    },
    {
        id: "2",
        title: "Follow-up",
        content: "Oi! Passando para saber se conseguiu analisar nossa proposta. Ficou alguma dúvida?",
    },
    {
        id: "3",
        title: "Proposta",
        content: "Excelente! Vou preparar uma proposta personalizada para você. Qual o melhor horário para conversarmos?",
    },
    {
        id: "4",
        title: "Agradecimento",
        content: "Muito obrigado pelo seu interesse! Estou à disposição para qualquer dúvida.",
    },
];

export const QuickTemplates = ({ onSelectTemplate }: QuickTemplatesProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border-t border-border bg-card/50">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-2 flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Respostas Rápidas
                </span>
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                ) : (
                    <ChevronUp className="h-4 w-4" />
                )}
            </button>

            <div
                className={cn(
                    "grid grid-cols-2 gap-2 px-4 overflow-hidden transition-all duration-200",
                    isExpanded ? "max-h-32 pb-3" : "max-h-0"
                )}
            >
                {templates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => onSelectTemplate(template.content)}
                        className="text-left p-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/30 transition-all"
                    >
                        <span className="text-xs font-medium text-primary">{template.title}</span>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {template.content.substring(0, 40)}...
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};
