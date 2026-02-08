import { useState, useEffect } from 'react';
import { Lead, CompanyType, CompanySize, ActivityBranch, COMPANY_TYPES, COMPANY_SIZES, ACTIVITY_BRANCHES } from '@/types/lead';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingLead?: Lead | null;
}

const defaultFormData = {
  name: '',
  phone: '',
  email: '',
  type: 'lavacar' as CompanyType,
  activityBranch: 'servicos' as ActivityBranch,
  size: 'pequeno' as CompanySize,
  location: '',
  address: '',
  website: '',
  successChance: 50,
  tips: '',
  contacted: false,
  folderId: null,
  comments: '',
};

export function LeadModal({ isOpen, onClose, onSave, editingLead }: LeadModalProps) {
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (editingLead) {
      setFormData({
        name: editingLead.name || '',
        phone: editingLead.phone || '',
        email: editingLead.email || '',
        type: editingLead.type,
        activityBranch: editingLead.activityBranch,
        size: editingLead.size,
        location: editingLead.location || '',
        address: editingLead.address || '',
        website: editingLead.website || '',
        successChance: editingLead.successChance || 50,
        tips: editingLead.tips || '',
        contacted: editingLead.contacted || false,
        folderId: editingLead.folderId || null,
        comments: editingLead.comments || '',
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [editingLead, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editingLead ? 'Editar Lead' : 'Novo Lead'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nome da Empresa</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Auto Brilho Lava Car"
                className="input-dark"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Telefone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="input-dark"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">E-mail</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com"
                className="input-dark"
              />
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tipo de Empresa</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as CompanyType })}
              >
                <SelectTrigger className="input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {Object.entries(COMPANY_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Ramo de Atividade</label>
              <Select
                value={formData.activityBranch}
                onValueChange={(value) => setFormData({ ...formData, activityBranch: value as ActivityBranch })}
              >
                <SelectTrigger className="input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {Object.entries(ACTIVITY_BRANCHES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Porte</label>
              <Select
                value={formData.size}
                onValueChange={(value) => setFormData({ ...formData, size: value as CompanySize })}
              >
                <SelectTrigger className="input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {Object.entries(COMPANY_SIZES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Cidade/Estado</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="São Paulo, SP"
                className="input-dark"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="www.empresa.com.br"
                className="input-dark"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Endereço Completo</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro"
                className="input-dark"
              />
            </div>
          </div>

          {/* Success Chance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Chance de Acerto</label>
              <span className="text-lg font-bold text-primary">{formData.successChance}%</span>
            </div>
            <Slider
              value={[formData.successChance]}
              onValueChange={(value) => setFormData({ ...formData, successChance: value[0] })}
              min={5}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Tips and Comments */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Dicas</label>
              <Textarea
                value={formData.tips}
                onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                placeholder="Ex: Cliente bem remunerado, site sem catálogo..."
                className="input-dark resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Comentários</label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Anotações adicionais..."
                className="input-dark resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary">
              {editingLead ? 'Salvar Alterações' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
