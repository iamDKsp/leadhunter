import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Lead, Stage, COMPANY_TYPES, COMPANY_SIZES, ACTIVITY_BRANCHES, CompanyType, CompanySize, ActivityBranch } from '@/types/lead';
import { X, Plus, Building2, ThumbsUp, ThumbsDown, CheckCircle2, Save, MapPin, Trash2, Pencil, Calendar, Clock, CalendarCheck, MessageSquarePlus } from 'lucide-react';
import api from '@/services/api';
import CelebrationModal from './CelebrationModal';
import MeetingModal from './MeetingModal';
import { FirstContactTemplateModal } from './FirstContactTemplateModal';

// Preset tag colors
const TAG_COLORS = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#ef4444', // red
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#6366f1', // indigo
    '#64748b', // slate
];

interface TagData {
    text: string;
    color: string;
}

interface LeadFormModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'folderId'> & { id?: string }) => void;
    lead?: Lead | null;
    stages: Stage[];
}

const LeadFormModal = ({ open, onClose, onSave, lead, stages }: LeadFormModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'outros' as CompanyType,
        activityBranch: 'servicos' as ActivityBranch,
        size: 'pequeno' as CompanySize,
        phone: '',
        email: '',
        website: '',
        address: '',
        tips: '',
        successChance: 50,
        stageId: stages[0]?.id || '',
        tags: [] as string[],
        contacted: false,
        comments: '',
        value: 0
    });
    const [newTag, setNewTag] = useState('');
    const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0]);
    const [isImageOpen, setIsImageOpen] = useState(false);

    // Tags with colors (stored as JSON in the tag string: "COLOR:TEXT")
    const parseTags = (tags: string[]): TagData[] => {
        return tags.map(tag => {
            if (tag.includes('::')) {
                const [color, text] = tag.split('::', 2);
                return { color, text };
            }
            return { text: tag, color: '#64748b' };
        });
    };

    const serializeTag = (text: string, color: string): string => {
        return `${color}::${text}`;
    };

    // Tasks State
    const [tasks, setTasks] = useState<any[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTaskTitle, setEditTaskTitle] = useState('');
    const [editTaskDate, setEditTaskDate] = useState('');
    const [editTaskTime, setEditTaskTime] = useState('');
    const [editTaskPriority, setEditTaskPriority] = useState('medium');

    // Celebration
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationValue, setCelebrationValue] = useState(0);
    const [celebrationName, setCelebrationName] = useState('');

    // Meeting
    const [showMeeting, setShowMeeting] = useState(false);
    const [meetingName, setMeetingName] = useState('');

    // First Contact Template
    const [showFirstContact, setShowFirstContact] = useState(false);

    // Auto-save debounce ref
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialLoad = useRef(true);
    const prevFormDataRef = useRef<string>('');

    useEffect(() => {
        if (open && lead?.id) {
            fetchTasks();
        } else {
            setTasks([]);
        }
    }, [open, lead]);

    const fetchTasks = async () => {
        if (!lead?.id) return;
        try {
            const res = await api.get(`/personal/tasks?companyId=${lead.id}`);
            setTasks(res.data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        }
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !lead?.id) return;
        try {
            let dueDate = null;
            if (newTaskDate) {
                dueDate = newTaskTime
                    ? `${newTaskDate}T${newTaskTime}:00`
                    : `${newTaskDate}T12:00:00`;
            }
            const res = await api.post('/personal/tasks', {
                title: newTaskTitle,
                companyId: lead.id,
                type: 'general',
                priority: newTaskPriority,
                dueDate
            });
            setTasks([...tasks, res.data]);
            setNewTaskTitle('');
            setNewTaskDate('');
            setNewTaskTime('');
            setNewTaskPriority('medium');
        } catch (error) {
            console.error("Failed to add task", error);
        }
    };

    const handleToggleTask = async (task: any) => {
        try {
            const updated = { ...task, completed: !task.completed };
            setTasks(tasks.map(t => t.id === task.id ? updated : t));
            await api.patch(`/personal/tasks/${task.id}`, { completed: updated.completed });
        } catch (error) {
            console.error("Failed to toggle task", error);
            fetchTasks();
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            setTasks(tasks.filter(t => t.id !== taskId));
            await api.delete(`/personal/tasks/${taskId}`);
        } catch (error) {
            console.error("Failed to delete task", error);
            fetchTasks();
        }
    };

    const handleStartEditTask = (task: any) => {
        setEditingTaskId(task.id);
        setEditTaskTitle(task.title);
        // Parse dueDate if exists
        if (task.dueDate && task.dueDate !== 'Sem prazo') {
            try {
                const d = new Date(task.dueDate);
                if (!isNaN(d.getTime())) {
                    setEditTaskDate(d.toISOString().split('T')[0]);
                    setEditTaskTime(d.toTimeString().slice(0, 5));
                } else {
                    setEditTaskDate('');
                    setEditTaskTime('');
                }
            } catch {
                setEditTaskDate('');
                setEditTaskTime('');
            }
        } else {
            setEditTaskDate('');
            setEditTaskTime('');
        }
        setEditTaskPriority(task.priority || 'medium');
    };

    const handleSaveEditTask = async () => {
        if (!editingTaskId || !editTaskTitle.trim()) return;
        try {
            let dueDate: string | null = null;
            if (editTaskDate) {
                dueDate = editTaskTime
                    ? `${editTaskDate}T${editTaskTime}:00`
                    : `${editTaskDate}T12:00:00`;
            }
            const res = await api.patch(`/personal/tasks/${editingTaskId}`, {
                title: editTaskTitle,
                priority: editTaskPriority,
                dueDate
            });
            setTasks(tasks.map(t => t.id === editingTaskId ? res.data : t));
            setEditingTaskId(null);
        } catch (error) {
            console.error("Failed to edit task", error);
        }
    };

    const handleStatusChange = (status: 'won' | 'lost') => {
        if (!lead?.id) return;
        const sorted = [...stages].sort((a, b) => a.order - b.order);
        const targetStage = sorted[sorted.length - 1];

        const updatedData = {
            ...formData,
            stageId: targetStage?.id || formData.stageId,
            id: lead.id,
            location: formData.address,
            googlePlaceId: lead?.googlePlaceId,
            status
        };

        onSave(updatedData as any);

        if (status === 'won') {
            setCelebrationValue(formData.value || 0);
            setCelebrationName(formData.name);
            setShowCelebration(true);
        } else {
            onClose();
        }
    };

    const handleCelebrationClose = () => {
        setShowCelebration(false);
        onClose();
    };

    const handleMeetingSchedule = () => {
        if (!lead?.id) return;
        // Find a stage that matches "reunião" by name (case insensitive)
        const meetingStage = stages.find(s => s.name.toLowerCase().includes('reuni'));

        const updatedData = {
            ...formData,
            stageId: meetingStage?.id || formData.stageId,
            id: lead.id,
            location: formData.address,
            googlePlaceId: lead?.googlePlaceId,
            status: 'meeting' as const
        };

        onSave(updatedData as any);
        setMeetingName(formData.name);
        setShowMeeting(true);
    };

    const handleMeetingClose = () => {
        setShowMeeting(false);
        onClose();
    };

    useEffect(() => {
        if (lead) {
            setFormData({
                name: lead.name,
                type: lead.type,
                activityBranch: lead.activityBranch,
                size: lead.size,
                phone: lead.phone || '',
                email: lead.email || '',
                website: lead.website || '',
                address: lead.address || '',
                tips: lead.tips || '',
                successChance: lead.successChance,
                stageId: lead.stageId || stages[0]?.id || '',
                tags: lead.tags || [],
                contacted: lead.contacted,
                comments: lead.comments || '',
                value: lead.value || 0
            });
        } else {
            setFormData({
                name: '',
                type: 'outros',
                activityBranch: 'servicos',
                size: 'pequeno',
                phone: '',
                email: '',
                website: '',
                address: '',
                tips: '',
                successChance: 50,
                stageId: stages[0]?.id || '',
                tags: [],
                contacted: false,
                comments: '',
                value: 0
            });
        }
        isInitialLoad.current = true;
    }, [lead, stages, open]);

    // Auto-save effect for existing leads
    useEffect(() => {
        if (!lead?.id || !open) return;
        const serialized = JSON.stringify(formData);

        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            prevFormDataRef.current = serialized;
            return;
        }

        if (serialized === prevFormDataRef.current) return;
        prevFormDataRef.current = serialized;

        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

        autoSaveTimer.current = setTimeout(() => {
            onSave({
                ...formData,
                id: lead.id,
                location: formData.address,
                googlePlaceId: lead?.googlePlaceId
            });
        }, 800);

        return () => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        };
    }, [formData, lead, open, onSave]);

    const handleAddTag = () => {
        if (newTag.trim()) {
            const serialized = serializeTag(newTag.trim().toUpperCase(), selectedTagColor);
            if (!formData.tags.includes(serialized)) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, serialized]
                }));
            }
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        onSave({
            ...formData,
            id: lead?.id,
            location: formData.address,
            googlePlaceId: lead?.googlePlaceId
        });
        onClose();
    };

    const openGoogleMaps = () => {
        const address = formData.address || formData.name;
        if (address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
        }
    };

    // Dynamic color based on probability
    const getChanceColor = (value: number) => {
        if (value >= 80) return { track: '#22c55e', text: 'text-green-400' };
        if (value >= 60) return { track: '#eab308', text: 'text-yellow-400' };
        if (value >= 30) return { track: '#f97316', text: 'text-orange-400' };
        return { track: '#ef4444', text: 'text-red-400' };
    };

    const chanceColor = getChanceColor(formData.successChance);
    const parsedTags = parseTags(formData.tags);

    const getPriorityLabel = (p: string) => {
        if (p === 'high') return '🔴 Alta';
        if (p === 'medium') return '🟡 Média';
        return '🟢 Baixa';
    };

    const getPriorityColor = (p: string) => {
        if (p === 'high') return 'text-red-400';
        if (p === 'medium') return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-6xl bg-card/95 backdrop-blur-xl border-border/30 max-h-[90vh] overflow-y-auto w-full">
                    <DialogHeader>
                        {lead && (
                            <div className="flex items-center gap-4 mb-2">
                                <div
                                    className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center border border-border/30 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => { if (lead.photoUrl) setIsImageOpen(true); }}
                                >
                                    {lead.photoUrl ? (
                                        <img src={lead.photoUrl} alt={lead.name} className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <Building2 className={`w-8 h-8 text-muted-foreground ${lead.photoUrl ? 'hidden' : ''}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <DialogTitle className="text-xl font-semibold truncate">{lead.name}</DialogTitle>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-muted-foreground truncate">{lead.address || 'Sem endereço'}</p>
                                        {(lead.address || lead.name) && (
                                            <button
                                                onClick={openGoogleMaps}
                                                className="flex-shrink-0 p-1 rounded hover:bg-primary/10 text-primary transition-colors"
                                                title="Abrir no Google Maps"
                                            >
                                                <MapPin className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* Status Buttons */}
                                <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm"
                                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                                            onClick={() => handleStatusChange('lost')}>
                                            <ThumbsDown className="w-4 h-4 mr-1" /> Perdido
                                        </Button>
                                        <Button type="button" variant="outline" size="sm"
                                            className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20"
                                            onClick={handleMeetingSchedule}>
                                            <CalendarCheck className="w-4 h-4 mr-1" /> Reunião
                                        </Button>
                                        <Button type="button" variant="outline" size="sm"
                                            className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
                                            onClick={() => handleStatusChange('won')}>
                                            <ThumbsUp className="w-4 h-4 mr-1" /> Ganho
                                        </Button>
                                    </div>
                                    {lead?.phone && (
                                        <Button type="button" variant="outline" size="sm"
                                            className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                                            onClick={() => setShowFirstContact(true)}>
                                            <MessageSquarePlus className="w-4 h-4 mr-1" /> Primeiro Contato
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                        {!lead && (
                            <DialogTitle className="text-xl font-semibold">Novo Lead</DialogTitle>
                        )}
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* ====== LEFT COLUMN ====== */}
                            <div className="space-y-4">
                                {/* Nome */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome da Empresa *</Label>
                                    <Input id="name" value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nome da empresa ou lead" className="bg-background/50 border-border/30" required />
                                </div>

                                {/* Detalhes grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Categoria</Label>
                                        <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as CompanyType }))}>
                                            <SelectTrigger className="bg-background/50 border-border/30 h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(COMPANY_TYPES).map(([k, v]) => (
                                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Ramo</Label>
                                        <Select value={formData.activityBranch} onValueChange={(v) => setFormData(prev => ({ ...prev, activityBranch: v as ActivityBranch }))}>
                                            <SelectTrigger className="bg-background/50 border-border/30 h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(ACTIVITY_BRANCHES).map(([k, l]) => (
                                                    <SelectItem key={k} value={k}>{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Porte</Label>
                                        <Select value={formData.size} onValueChange={(v) => setFormData(prev => ({ ...prev, size: v as CompanySize }))}>
                                            <SelectTrigger className="bg-background/50 border-border/30 h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(COMPANY_SIZES).map(([k, l]) => (
                                                    <SelectItem key={k} value={k}>{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Etapa</Label>
                                        <Select value={formData.stageId} onValueChange={(v) => setFormData(prev => ({ ...prev, stageId: v }))}>
                                            <SelectTrigger className="bg-background/50 border-border/30 h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {stages.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                                            {s.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Valor */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="value" className="text-xs">Valor Estimado (R$)</Label>
                                    <Input id="value" type="number" value={formData.value}
                                        onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0,00" className="bg-background/50 border-border/30 h-9" />
                                </div>

                                {/* Contato */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-xs">Telefone</Label>
                                        <Input id="phone" value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="(00) 00000-0000" className="bg-background/50 border-border/30 h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs">Email</Label>
                                        <Input id="email" type="email" value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="email@empresa.com" className="bg-background/50 border-border/30 h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="website" className="text-xs">Website</Label>
                                        <Input id="website" value={formData.website}
                                            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                            placeholder="https://www.exemplo.com" className="bg-background/50 border-border/30 h-9" />
                                    </div>
                                </div>

                                {/* Endereço with Maps button */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="address" className="text-xs">Endereço</Label>
                                        {formData.address && (
                                            <button type="button" onClick={openGoogleMaps}
                                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                                                <MapPin className="w-3 h-3" /> Google Maps
                                            </button>
                                        )}
                                    </div>
                                    <Textarea id="address" value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="Endereço completo" className="bg-background/50 border-border/30 min-h-[60px] resize-none" />
                                </div>
                            </div>

                            {/* ====== RIGHT COLUMN ====== */}
                            <div className="space-y-4">
                                {/* Tags with color picker */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Tags</Label>
                                    <div className="flex gap-2">
                                        <Input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="Adicionar tag..." className="bg-background/50 border-border/30 h-9"
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} />
                                        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={handleAddTag}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {/* Color picker palette */}
                                    <div className="flex gap-1.5 flex-wrap">
                                        {TAG_COLORS.map(color => (
                                            <button key={color} type="button"
                                                className={`w-5 h-5 rounded-full transition-all border-2 ${selectedTagColor === color ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setSelectedTagColor(color)} />
                                        ))}
                                    </div>
                                    {parsedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {parsedTags.map((tag, i) => (
                                                <span key={i}
                                                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-white"
                                                    style={{ backgroundColor: tag.color }}>
                                                    {tag.text}
                                                    <button type="button" onClick={() => handleRemoveTag(formData.tags[i])}
                                                        className="ml-0.5 hover:opacity-70">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Observações */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="tips" className="text-xs">Observações / Dicas</Label>
                                    <Textarea id="tips" value={formData.tips}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tips: e.target.value }))}
                                        placeholder="Dicas sobre o lead..." className="bg-background/50 border-border/30 min-h-[60px] resize-none" />
                                </div>

                                {/* Chance de Acerto */}
                                <div className="space-y-3 p-3 rounded-lg bg-background/30 border border-border/20">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Chance de Acerto</Label>
                                        <span className={`text-sm font-bold ${chanceColor.text}`}>{formData.successChance}%</span>
                                    </div>
                                    <Slider value={[formData.successChance]}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, successChance: v[0] }))}
                                        min={0} max={100} step={5} className="w-full" />
                                    <div className="h-2 rounded-full overflow-hidden bg-muted/50">
                                        <div className="h-full rounded-full transition-all duration-300"
                                            style={{ width: `${formData.successChance}%`, backgroundColor: chanceColor.track, boxShadow: `0 0 8px ${chanceColor.track}60` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Baixa</span><span>Média</span><span>Alta</span>
                                    </div>
                                </div>

                                {/* Tarefas - Full Management */}
                                <div className="space-y-2 pt-2 border-t border-border/30">
                                    <h3 className="text-sm font-medium">Tarefas</h3>
                                    {/* New task form */}
                                    <div className="space-y-2 p-2 rounded-lg bg-background/20 border border-border/10">
                                        <div className="flex gap-2">
                                            <Input placeholder="Nova tarefa..." value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(); } }}
                                                className="bg-background/50 border-border/30 h-8 text-sm" />
                                            <Button type="button" size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleAddTask} disabled={!lead?.id}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <div className="flex items-center gap-1 flex-1">
                                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                                <Input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)}
                                                    className="bg-background/50 border-border/30 h-7 text-xs" />
                                            </div>
                                            <div className="flex items-center gap-1 flex-1">
                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                <Input type="time" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)}
                                                    className="bg-background/50 border-border/30 h-7 text-xs" />
                                            </div>
                                            <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                                                <SelectTrigger className="bg-background/50 border-border/30 h-7 text-xs w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="high">🔴 Alta</SelectItem>
                                                    <SelectItem value="medium">🟡 Média</SelectItem>
                                                    <SelectItem value="low">🟢 Baixa</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Task list */}
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                        {tasks.map(task => (
                                            <div key={task.id}>
                                                {editingTaskId === task.id ? (
                                                    /* Edit mode */
                                                    <div className="space-y-1.5 p-2 rounded bg-primary/5 border border-primary/20">
                                                        <Input value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)}
                                                            className="bg-background/50 border-border/30 h-7 text-xs" />
                                                        <div className="flex gap-2 items-center">
                                                            <Input type="date" value={editTaskDate} onChange={(e) => setEditTaskDate(e.target.value)}
                                                                className="bg-background/50 border-border/30 h-7 text-xs flex-1" />
                                                            <Input type="time" value={editTaskTime} onChange={(e) => setEditTaskTime(e.target.value)}
                                                                className="bg-background/50 border-border/30 h-7 text-xs flex-1" />
                                                            <Select value={editTaskPriority} onValueChange={setEditTaskPriority}>
                                                                <SelectTrigger className="bg-background/50 border-border/30 h-7 text-xs w-28">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="high">🔴 Alta</SelectItem>
                                                                    <SelectItem value="medium">🟡 Média</SelectItem>
                                                                    <SelectItem value="low">🟢 Baixa</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex gap-1 justify-end">
                                                            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs"
                                                                onClick={() => setEditingTaskId(null)}>Cancelar</Button>
                                                            <Button type="button" size="sm" className="h-6 text-xs"
                                                                onClick={handleSaveEditTask}>Salvar</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* View mode */
                                                    <div className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm group">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <button type="button" onClick={() => handleToggleTask(task)}
                                                                className="flex-shrink-0">
                                                                <CheckCircle2 className={`w-4 h-4 ${task.completed ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                                                            </button>
                                                            <div className="flex-1 min-w-0">
                                                                <span className={`text-xs ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                                    {task.title}
                                                                </span>
                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                    {task.dueDate && task.dueDate !== 'Sem prazo' && (
                                                                        <span className="flex items-center gap-0.5">
                                                                            <Calendar className="w-2.5 h-2.5" /> {task.dueDate}
                                                                        </span>
                                                                    )}
                                                                    {task.priority && (
                                                                        <span className={getPriorityColor(task.priority)}>
                                                                            {getPriorityLabel(task.priority)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                                                                onClick={() => handleStartEditTask(task)}>
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                                                                onClick={() => handleDeleteTask(task.id)}>
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {lead && tasks.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-2">Nenhuma tarefa encontrada.</p>
                                        )}
                                        {!lead && (
                                            <p className="text-xs text-muted-foreground text-center py-2">Salve o lead para adicionar tarefas.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        {!lead && (
                            <DialogFooter className="gap-2 sm:gap-0 justify-end items-center w-full pt-2 border-t border-border/30">
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                                    <Button type="submit">Criar Lead</Button>
                                </div>
                            </DialogFooter>
                        )}

                        {lead && (
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                                <Save className="w-3 h-3" />
                                <span>Salvamento automático ativado</span>
                            </div>
                        )}
                    </form>
                </DialogContent>
            </Dialog>

            {/* Full Screen Image Dialog */}
            <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
                    <div className="relative">
                        <button onClick={() => setIsImageOpen(false)}
                            className="absolute -top-10 right-0 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                        {lead?.photoUrl && (
                            <img src={lead.photoUrl} alt={lead.name}
                                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Celebration Modal */}
            <CelebrationModal
                open={showCelebration}
                onClose={handleCelebrationClose}
                value={celebrationValue}
                leadName={celebrationName}
            />

            {/* Meeting Modal */}
            <MeetingModal
                open={showMeeting}
                onClose={handleMeetingClose}
                leadName={meetingName}
            />

            {/* First Contact Template Modal */}
            {lead && (
                <FirstContactTemplateModal
                    open={showFirstContact}
                    onClose={() => setShowFirstContact(false)}
                    lead={{
                        id: lead.id,
                        name: lead.name,
                        phone: formData.phone || lead.phone || '',
                    }}
                />
            )}
        </>
    );
};
export default LeadFormModal;
