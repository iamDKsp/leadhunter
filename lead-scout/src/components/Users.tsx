import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    interfacePreference?: string;
    useOwnWhatsApp?: boolean;
    customTag?: string | null;
    customTagColor?: string | null;
}

export function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [interfacePreference, setInterfacePreference] = useState('BOTH');
    const [useOwnWhatsApp, setUseOwnWhatsApp] = useState(false);
    const [customTag, setCustomTag] = useState('');
    const [customTagColor, setCustomTagColor] = useState('#000000');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/auth/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setInterfacePreference('BOTH');
        setUseOwnWhatsApp(false);
        setCustomTag('');
        setCustomTagColor('#000000');
        setEditingUser(null);
    };

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setName(user.name);
            setEmail(user.email);
            setInterfacePreference(user.interfacePreference || 'BOTH');
            setUseOwnWhatsApp(user.useOwnWhatsApp || false);
            setCustomTag(user.customTag || '');
            setCustomTagColor(user.customTagColor || '#000000');
            setPassword(''); // Don't fill password on edit
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            if (editingUser) {
                // Edit mode
                await axios.put(`${API_URL}/auth/users/${editingUser.id}`, {
                    name,
                    email,
                    interfacePreference,
                    useOwnWhatsApp,
                    customTag,
                    customTagColor,
                    ...(password && { password }) // Only send password if provided
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Usuário atualizado com sucesso!');
            } else {
                // Create mode
                await axios.post(`${API_URL}/auth/create-user`, {
                    email,
                    password,
                    name,
                    interfacePreference,
                    useOwnWhatsApp,
                    customTag,
                    customTagColor
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Usuário criado com sucesso!');
            }

            setIsDialogOpen(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(editingUser ? 'Erro ao atualizar usuário.' : 'Erro ao criar usuário.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/auth/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Usuário excluído com sucesso!');
            fetchUsers();
        } catch (error) {
            toast.error('Erro ao excluir usuário.');
        }
    };

    // Need to import Switch and Label for the toggle
    // Assuming shadcn switch exists or standard checkbox. Let's use standard checkbox for simplicity if Switch not waiting.
    // Actually, let's use a checkbox styled as switch or just simple checkbox.
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center animate-fade-in">
                <div>
                    <h2 className="text-xl font-semibold text-primary">Gerenciamento de Usuários</h2>
                    <p className="text-sm text-muted-foreground mt-1">Adicione, edite e remova membros da equipe.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            onClick={() => handleOpenDialog()}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg hover:shadow-green-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Usuário
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                            <DialogDescription>
                                {editingUser ? 'Edite as informações do usuário abaixo.' : 'Preencha os dados para criar um novo usuário.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nome do usuário"
                                    required
                                    className="bg-secondary/50 border-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@exemplo.com"
                                    required
                                    className="bg-secondary/50 border-input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customTag">Tag Personalizada</Label>
                                    <Input
                                        id="customTag"
                                        value={customTag}
                                        onChange={(e) => setCustomTag(e.target.value)}
                                        placeholder="Ex: Gerente"
                                        className="bg-secondary/50 border-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customTagColor">Cor da Tag</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="customTagColor"
                                            type="color"
                                            value={customTagColor}
                                            onChange={(e) => setCustomTagColor(e.target.value)}
                                            className="w-12 h-10 p-1 bg-secondary/50 border-input cursor-pointer"
                                        />
                                        <Input
                                            value={customTagColor}
                                            onChange={(e) => setCustomTagColor(e.target.value)}
                                            placeholder="#000000"
                                            className="flex-1 bg-secondary/50 border-input"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interface">Interface Preferida</Label>
                                <Select value={interfacePreference} onValueChange={setInterfacePreference}>
                                    <SelectTrigger className="bg-secondary/50 border-input">
                                        <SelectValue placeholder="Selecione a interface" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BOTH">Ambos (PC e Mobile)</SelectItem>
                                        <SelectItem value="PC">Apenas PC</SelectItem>
                                        <SelectItem value="MOBILE">Apenas Mobile</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg border border-border/50">
                                <input
                                    type="checkbox"
                                    id="useOwnWhatsApp"
                                    checked={useOwnWhatsApp}
                                    onChange={(e) => setUseOwnWhatsApp(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="useOwnWhatsApp" className="cursor-pointer font-medium">
                                        Usar WhatsApp Próprio
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Habilita o usuário a conectar sua conta pessoal do WhatsApp.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {editingUser ? 'Nova Senha (opcional)' : 'Senha'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={editingUser ? 'Deixe em branco para manter' : ''}
                                    required={!editingUser}
                                    className="bg-secondary/50 border-input"
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full btn-primary">
                                {loading ? 'Salvando...' : (editingUser ? 'Salvar Alterações' : 'Criar Usuário')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl overflow-hidden animate-fade-in delay-100 shadow-xl">
                <div className="p-4 border-b border-border/30">
                    <h3 className="font-semibold text-foreground">Usuários Cadastrados</h3>
                    <p className="text-sm text-muted-foreground">Lista detalhada de todos os usuários do sistema.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/30">
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Nome</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Email</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Tag</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Interface</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Criado em</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                                    <td className="px-6 py-4 text-primary">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {user.customTag ? (
                                            <span
                                                className="px-2 py-1 rounded text-xs font-semibold"
                                                style={{
                                                    backgroundColor: `${user.customTagColor}20`,
                                                    color: user.customTagColor || '#888888',
                                                    border: `1px solid ${user.customTagColor}50`
                                                }}
                                            >
                                                {user.customTag}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{user.interfacePreference || 'BOTH'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenDialog(user)}
                                                className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
