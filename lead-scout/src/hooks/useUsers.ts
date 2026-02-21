import { useState, useEffect } from 'react';
import { users as usersApi } from '@/services/api';
import { User } from '@/types/auth'; // Using User type from auth.ts
import { toast } from 'sonner';

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const data = await usersApi.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            // toast.error('Erro ao carregar usuários');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return {
        users,
        isLoading,
        refresh: fetchUsers
    };
}
