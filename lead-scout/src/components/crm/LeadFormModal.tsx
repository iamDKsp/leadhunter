import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Lead, Stage, COMPANY_TYPES, COMPANY_SIZES, ACTIVITY_BRANCHES, CompanyType, CompanySize, ActivityBranch } from '@/types/lead';
import { X, Plus, Building2 } from 'lucide-react';

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
    });
    const [newTag, setNewTag] = useState('');
    const [isImageOpen, setIsImageOpen] = useState(false);

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
                comments: lead.comments || ''
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
                comments: ''
            });
        }
    }, [lead, stages, open]);

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim().toUpperCase())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim().toUpperCase()]
            }));
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

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-4xl bg-card/95 backdrop-blur-xl border-border/30 max-h-[90vh] overflow-y-auto w-full">
                    <DialogHeader>
                        {/* Photo Header for existing leads */}
                        {lead && (
                            <div className="flex items-center gap-4 mb-2">
                                <div
                                    className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center border border-border/30 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                        if (lead.photoUrl) setIsImageOpen(true);
                                    }}
                                >
                                    {lead.photoUrl ? (
                                        <img
                                            src={lead.photoUrl}
                                            alt={lead.name}
                                            className="w-full h-full object-cover"
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
                                    <DialogTitle className="text-xl font-semibold truncate">
                                        {lead.name}
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground truncate">{lead.address || 'Sem endereço'}</p>
                                </div>
                            </div>
                        )}
                        {!lead && (
                            <DialogTitle className="text-xl font-semibold">
                                Novo Lead
                            </DialogTitle>
                        )}
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nome */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Empresa *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Nome da empresa ou lead"
                                className="bg-background/50 border-border/30"
                                required
                            />
                        </div>

                        {/* Detalhes: Categoria, Ramo, Porte, Etapa - Horizontal Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CompanyType }))}
                                >
                                    <SelectTrigger className="bg-background/50 border-border/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(COMPANY_TYPES).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>{value.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Ramo</Label>
                                <Select
                                    value={formData.activityBranch}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, activityBranch: value as ActivityBranch }))}
                                >
                                    <SelectTrigger className="bg-background/50 border-border/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ACTIVITY_BRANCHES).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Porte</Label>
                                <Select
                                    value={formData.size}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, size: value as CompanySize }))}
                                >
                                    <SelectTrigger className="bg-background/50 border-border/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(COMPANY_SIZES).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Etapa</Label>
                                <Select
                                    value={formData.stageId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, stageId: value }))}
                                >
                                    <SelectTrigger className="bg-background/50 border-border/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stages.map(stage => (
                                            <SelectItem key={stage.id} value={stage.id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: stage.color }}
                                                    />
                                                    {stage.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Adicionar tag..."
                                    className="bg-background/50 border-border/30"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="gap-1">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Contato - 3 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="(00) 00000-0000"
                                    className="bg-background/50 border-border/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@empresa.com"
                                    className="bg-background/50 border-border/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    value={formData.website}
                                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                    placeholder="https://www.exemplo.com"
                                    className="bg-background/50 border-border/30"
                                />
                            </div>
                        </div>

                        {/* Endereço & Dicas - Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Endereço completo"
                                    className="bg-background/50 border-border/30 min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tips">Observações / Dicas</Label>
                                <Textarea
                                    id="tips"
                                    value={formData.tips}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tips: e.target.value }))}
                                    placeholder="Dicas sobre o lead..."
                                    className="bg-background/50 border-border/30 min-h-[80px]"
                                />
                            </div>
                        </div>

                        {/* Chance de Acerto */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Chance de Acerto</Label>
                                <span className="text-sm font-medium text-primary">{formData.successChance}%</span>
                            </div>
                            <Slider
                                value={[formData.successChance]}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, successChance: value[0] }))}
                                min={0}
                                max={100}
                                step={5}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Baixa</span>
                                <span>Média</span>
                                <span>Alta</span>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                {lead ? 'Salvar Alterações' : 'Criar Lead'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Full Screen Image Dialog */}
            <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
                    <div className="relative">
                        <button
                            onClick={() => setIsImageOpen(false)}
                            className="absolute -top-10 right-0 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        {lead?.photoUrl && (
                            <img
                                src={lead.photoUrl}
                                alt={lead.name}
                                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
export default LeadFormModal;
