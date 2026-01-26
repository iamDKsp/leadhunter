export type CompanyType = 'lavacar' | 'barbearia' | 'restaurante' | 'concertinas' | 'salao' | 'outros';
export type CompanySize = 'muito_pequeno' | 'pequeno' | 'medio' | 'grande';
export type ActivityBranch = 'servicos' | 'comercio' | 'industria' | 'tecnologia' | 'saude';

export interface Lead {
  id: string;
  googlePlaceId?: string;
  name: string;
  phone: string;
  email: string;
  type: CompanyType;
  activityBranch: ActivityBranch;
  size: CompanySize;
  location: string;
  address: string;
  website: string;
  successChance: number;
  tips: string;
  contacted: boolean;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  comments: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  leadCount: number;
}

export const COMPANY_TYPES: Record<CompanyType, { label: string; color: string }> = {
  lavacar: { label: 'Lava Car', color: 'lavacar' },
  barbearia: { label: 'Barbearia', color: 'barbearia' },
  restaurante: { label: 'Restaurante', color: 'restaurante' },
  concertinas: { label: 'Concertinas', color: 'concertinas' },
  salao: { label: 'Salão de Beleza', color: 'salao' },
  outros: { label: 'Outros', color: 'gray' },
};

export const COMPANY_SIZES: Record<CompanySize, string> = {
  muito_pequeno: 'Muito Pequeno',
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
};

export const ACTIVITY_BRANCHES: Record<ActivityBranch, string> = {
  servicos: 'Serviços',
  comercio: 'Comércio',
  industria: 'Indústria',
  tecnologia: 'Tecnologia',
  saude: 'Saúde',
};
