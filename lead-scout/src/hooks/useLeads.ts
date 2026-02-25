import { useState, useEffect } from 'react';
import { Lead, Folder } from '@/types/lead';
import { companies, folders as foldersApi } from '@/services/api';
import { toast } from 'sonner';

export function useLeads(status?: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [leadsResult, foldersResult] = await Promise.allSettled([
        companies.getAll({ status }),
        foldersApi.getAll()
      ]);

      if (leadsResult.status === 'fulfilled') {
        setLeads(leadsResult.value);
      } else {
        console.error('Failed to fetch leads:', leadsResult.reason);
        toast.error('Erro ao carregar leads');
      }

      if (foldersResult.status === 'fulfilled') {
        setFolders(foldersResult.value);
      } else {
        console.error('Failed to fetch folders:', foldersResult.reason);
        // Optional: toast error for folders
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newLead = await companies.create(lead);
      setLeads((prev) => [newLead, ...prev]);
      return newLead;
    } catch (error) {
      toast.error('Erro ao criar lead');
      throw error;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const updatedLead = await companies.update(id, updates);
      setLeads((prev) => prev.map((l) => (l.id === id ? updatedLead : l)));
    } catch (error) {
      toast.error('Erro ao atualizar lead');
      throw error;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await companies.delete(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      toast.error('Erro ao excluir lead');
    }
  };

  const bulkAssignLeads = async (companyIds: string[], userId: string) => {
    try {
      await companies.bulkAssign(companyIds, userId);
      // Re-fetch to get updated assigned leads or optimistically update
      fetchData();
    } catch (error) {
      toast.error('Erro ao atribuir leads em massa');
      throw error;
    }
  };

  const bulkMoveLeads = async (companyIds: string[], stageId: string) => {
    try {
      await companies.bulkMove(companyIds, stageId);
      // Optimistic update
      setLeads((prev) => prev.map((l) => companyIds.includes(l.id) ? { ...l, stageId } : l));
    } catch (error) {
      toast.error('Erro ao mover leads em massa');
      throw error;
    }
  };

  const bulkDeleteLeads = async (companyIds: string[]) => {
    try {
      await companies.bulkDelete(companyIds);
      setLeads((prev) => prev.filter((l) => !companyIds.includes(l.id)));
    } catch (error) {
      toast.error('Erro ao excluir leads em massa');
      throw error;
    }
  };

  const addFolder = async (name: string, color: string) => {
    try {
      const newFolder = await foldersApi.create(name, color);
      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    } catch (error) {
      toast.error('Erro ao criar pasta');
      throw error;
    }
  };

  const moveLeadToFolder = async (leadId: string, folderId: string | null) => {
    await updateLead(leadId, { folderId });
  };

  return {
    leads,
    folders,
    isLoading,
    addLead,
    updateLead,
    deleteLead,
    bulkAssignLeads,
    bulkMoveLeads,
    bulkDeleteLeads,
    addFolder,
    moveLeadToFolder,
    refresh: fetchData
  };
}
