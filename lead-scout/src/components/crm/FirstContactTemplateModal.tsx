import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Trash2,
    Pencil,
    Send,
    MessageSquarePlus,
    CheckCircle2,
    X,
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

interface Template {
    id: string;
    title: string;
    body: string;
}

interface FirstContactTemplateModalProps {
    open: boolean;
    onClose: () => void;
    lead: {
        id: string;
        name: string;
        phone: string;
    };
}

export const FirstContactTemplateModal = ({
    open,
    onClose,
    lead,
}: FirstContactTemplateModalProps) => {
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formBody, setFormBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchTemplates();
            setSelectedId(null);
            setIsCreating(false);
            setEditingId(null);
        }
    }, [open]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/templates');
            setTemplates(res.data);
        } catch {
            toast.error('Erro ao carregar templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formTitle.trim() || !formBody.trim()) return;
        try {
            const res = await api.post('/templates', { title: formTitle, body: formBody });
            setTemplates(prev => [...prev, res.data]);
            setSelectedId(res.data.id);
            setIsCreating(false);
            setFormTitle('');
            setFormBody('');
            toast.success('Template criado!');
        } catch {
            toast.error('Erro ao criar template');
        }
    };

    const handleUpdate = async (id: string) => {
        if (!formTitle.trim() || !formBody.trim()) return;
        try {
            const res = await api.patch(`/templates/${id}`, { title: formTitle, body: formBody });
            setTemplates(prev => prev.map(t => (t.id === id ? res.data : t)));
            setEditingId(null);
            setFormTitle('');
            setFormBody('');
            toast.success('Template atualizado!');
        } catch {
            toast.error('Erro ao atualizar template');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/templates/${id}`);
            setTemplates(prev => prev.filter(t => t.id !== id));
            if (selectedId === id) setSelectedId(null);
            toast.success('Template removido');
        } catch {
            toast.error('Erro ao remover template');
        }
    };

    const handleStartEdit = (template: Template) => {
        setEditingId(template.id);
        setFormTitle(template.title);
        setFormBody(template.body);
        setIsCreating(false);
    };

    const handleStartCreate = () => {
        setIsCreating(true);
        setEditingId(null);
        setFormTitle('');
        setFormBody('');
    };

    const handleSend = async () => {
        const selected = templates.find(t => t.id === selectedId);
        if (!selected || !lead.phone) return;

        setIsSending(true);
        try {
            // 1. Clean phone and build chatId
            const cleanPhone = lead.phone.replace(/\D/g, '');
            let fullPhone = cleanPhone;
            if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
                fullPhone = `55${cleanPhone}`;
            }
            const chatId = `${fullPhone}@s.whatsapp.net`;

            // 2. Create chat ownership record
            await api.post('/chat/create', {
                chatId,
                companyId: lead.id,
            });

            // 3. Send the WhatsApp message
            await api.post('/whatsapp/send', {
                to: chatId,
                message: selected.body,
            });

            toast.success('Mensagem enviada! Abrindo conversa...');
            onClose();

            // 4. Navigate to Conversas with this chat open
            navigate(
                `/conversas?chatId=${encodeURIComponent(chatId)}&name=${encodeURIComponent(lead.name)}&phone=${encodeURIComponent(lead.phone)}`
            );
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Erro ao enviar mensagem';
            toast.error(msg);
        } finally {
            setIsSending(false);
        }
    };

    const selectedTemplate = templates.find(t => t.id === selectedId);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-border/30 max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <MessageSquarePlus className="w-5 h-5 text-primary" />
                        Primeiro Contato
                        <Badge variant="secondary" className="ml-1 text-xs font-normal">
                            {lead.name}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Template list */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                                Templates Salvos
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1.5 text-xs"
                                onClick={handleStartCreate}
                            >
                                <Plus className="w-3 h-3" />
                                Nova Mensagem
                            </Button>
                        </div>

                        {isLoading ? (
                            <p className="text-xs text-muted-foreground text-center py-4">
                                Carregando...
                            </p>
                        ) : templates.length === 0 && !isCreating ? (
                            <div className="border-2 border-dashed border-border/40 rounded-lg p-6 text-center">
                                <MessageSquarePlus className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Nenhum template ainda.</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={handleStartCreate}
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Criar primeiro template
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {templates.map(template => (
                                    <div key={template.id}>
                                        {editingId === template.id ? (
                                            /* ── Edit inline ── */
                                            <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
                                                <Input
                                                    value={formTitle}
                                                    onChange={e => setFormTitle(e.target.value)}
                                                    placeholder="Título do template"
                                                    className="h-8 text-sm bg-background/50"
                                                />
                                                <Textarea
                                                    value={formBody}
                                                    onChange={e => setFormBody(e.target.value)}
                                                    placeholder="Corpo da mensagem..."
                                                    className="min-h-[80px] text-sm bg-background/50 resize-none"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() => handleUpdate(template.id)}
                                                    >
                                                        Salvar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* ── Template card ── */
                                            <div
                                                onClick={() =>
                                                    setSelectedId(
                                                        selectedId === template.id ? null : template.id
                                                    )
                                                }
                                                className={`p-3 rounded-lg border cursor-pointer transition-all group ${selectedId === template.id
                                                    ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                                                    : 'border-border/40 bg-background/30 hover:border-primary/40 hover:bg-primary/5'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            {selectedId === template.id && (
                                                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                                            )}
                                                            <span className="text-sm font-medium text-foreground truncate">
                                                                {template.title}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                            {template.body}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleStartEdit(template);
                                                            }}
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleDelete(template.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Create new template form */}
                    {isCreating && (
                        <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Nova Mensagem de Primeiro Contato</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setIsCreating(false)}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                            <Input
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                placeholder="Ex: Apresentação inicial"
                                className="h-8 text-sm bg-background/50"
                                autoFocus
                            />
                            <Textarea
                                value={formBody}
                                onChange={e => setFormBody(e.target.value)}
                                placeholder="Digite a mensagem de primeiro contato..."
                                className="min-h-[100px] text-sm bg-background/50 resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setIsCreating(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={handleCreate}
                                    disabled={!formTitle.trim() || !formBody.trim()}
                                >
                                    Salvar Template
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Preview pane */}
                    {selectedTemplate && (
                        <div className="rounded-lg border border-border/30 bg-background/30 p-3 space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                                Pré-visualização
                            </Label>
                            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                                <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                                    {selectedTemplate.body}
                                </p>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Será enviado para:{' '}
                                <span className="font-medium text-foreground">{lead.phone}</span>
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-2 border-t border-border/30">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSend}
                            disabled={!selectedId || isSending || !lead.phone}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Send className="w-4 h-4" />
                            {isSending ? 'Enviando...' : 'Enviar Primeiro Contato'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
