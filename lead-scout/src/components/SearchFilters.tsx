import { useState } from 'react';
import { CompanyType, CompanySize, ActivityBranch, COMPANY_TYPES, COMPANY_SIZES, ACTIVITY_BRANCHES } from '@/types/lead';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SearchFiltersState {
  searchTerm: string;
  type: CompanyType | 'all';
  size: CompanySize | 'all';
  activityBranch: ActivityBranch | 'all';
  contacted: 'all' | 'yes' | 'no';
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    onFiltersChange({
      searchTerm: '',
      type: 'all',
      size: 'all',
      activityBranch: 'all',
      contacted: 'all',
    });
  };

  const hasActiveFilters = 
    filters.type !== 'all' || 
    filters.size !== 'all' || 
    filters.activityBranch !== 'all' || 
    filters.contacted !== 'all';

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, telefone..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
            className="pl-10 input-dark h-11"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`gap-2 ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              !
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleReset} className="gap-2 text-muted-foreground">
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border animate-fade-in">
          {/* Company Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Tipo de Empresa</label>
            <Select
              value={filters.type}
              onValueChange={(value) => onFiltersChange({ ...filters, type: value as CompanyType | 'all' })}
            >
              <SelectTrigger className="input-dark">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(COMPANY_TYPES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Porte</label>
            <Select
              value={filters.size}
              onValueChange={(value) => onFiltersChange({ ...filters, size: value as CompanySize | 'all' })}
            >
              <SelectTrigger className="input-dark">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(COMPANY_SIZES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activity Branch */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Ramo de Atividade</label>
            <Select
              value={filters.activityBranch}
              onValueChange={(value) => onFiltersChange({ ...filters, activityBranch: value as ActivityBranch | 'all' })}
            >
              <SelectTrigger className="input-dark">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(ACTIVITY_BRANCHES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contacted Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Contatado</label>
            <Select
              value={filters.contacted}
              onValueChange={(value) => onFiltersChange({ ...filters, contacted: value as 'all' | 'yes' | 'no' })}
            >
              <SelectTrigger className="input-dark">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Sim</SelectItem>
                <SelectItem value="no">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
