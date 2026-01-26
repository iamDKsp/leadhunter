import { useState, useEffect } from 'react';
import { Lead, Folder } from '@/types/lead';
import { companies, folders as foldersApi } from '@/services/api';
import { toast } from 'sonner';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [leadsData, foldersData] = await Promise.all([
        companies.getAll(),
        foldersApi.getAll()
      ]);
      setLeads(leadsData);
      setFolders(foldersData);
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
    addFolder,
    moveLeadToFolder,
    refresh: fetchData
  };
}
