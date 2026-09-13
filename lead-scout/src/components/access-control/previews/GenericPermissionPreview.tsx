import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, KeyRound, CheckCircle2, XCircle, LucideIcon } from 'lucide-react';

interface GenericPermissionPreviewProps {
    label: string;
    description: string;
    category: string;
    icon: LucideIcon;
    riskLevel?: 'low' | 'medium' | 'high';
}

export function GenericPermissionPreview({
    label,
    description,
    category,
    icon: Icon,
    riskLevel = 'medium',
}: GenericPermissionPreviewProps) {
    const riskBadge = {
        low: { label: 'Operacional Básico', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
        medium: { label: 'Acesso Gerencial', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
        high: { label: 'Acesso Administrativo Sensível', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    }[riskLevel];

    return (
        <div className="relative w-full h-full p-4 flex flex-col justify-between select-none overflow-hidden font-sans text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground text-xs">{label}</h4>
                        <p className="text-[10px] text-muted-foreground capitalize">Categoria: {category}</p>
                    </div>
                </div>

                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${riskBadge.color}`}>
                    {riskBadge.label}
                </span>
            </div>

            {/* Central Animated Diagram */}
            <div className="my-auto py-3 space-y-3">
                <div className="bg-secondary/30 border border-border/70 rounded-lg p-3 relative overflow-hidden">
                    {/* Pulsing background glow */}
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none"
                    />

                    <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 text-primary">
                            <KeyRound className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-foreground text-[11px] leading-tight">
                                {description}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                O operador poderá executar essas ações de forma autônoma sem requerer autorização de um administrador.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Comparison Row */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded-md bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center gap-1 font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Se Habilitado</span>
                        </div>
                        <p className="text-muted-foreground text-[9px] leading-relaxed">
                            Módulo, ações e botões ficam visíveis no menu lateral e tela.
                        </p>
                    </div>

                    <div className="p-2 rounded-md bg-rose-500/5 border border-rose-500/20 space-y-1">
                        <div className="flex items-center gap-1 font-semibold text-rose-400">
                            <XCircle className="w-3 h-3" />
                            <span>Se Desabilitado</span>
                        </div>
                        <p className="text-muted-foreground text-[9px] leading-relaxed">
                            Acesso bloqueado com resposta 403 e elementos ocultos na UI.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Status indicator */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    Controle RBAC Ativo
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">Lead Hunter Security</span>
            </div>
        </div>
    );
}
