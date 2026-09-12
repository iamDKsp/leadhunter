import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/services/api';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import GeometricBackground from '@/components/login/GeometricBackground';
import CrownLogo from '@/components/login/CrownLogo';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await auth.login(email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            toast.success('Login realizado com sucesso!');
            navigate('/');
        } catch (error) {
            toast.error('Erro na autenticação. Verifique seus dados.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
            <GeometricBackground />
            <CrownLogo />

            <div className="login-card w-full max-w-sm p-6 sm:p-8">
                <h1 className="text-center text-primary font-bold text-xl tracking-widest mb-8">
                    LEAD HUNTER
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-border bg-transparent accent-primary"
                            />
                            Lembrar-me
                        </label>
                        <a
                            href="#"
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            Esqueceu a senha?
                        </a>
                    </div>

                    <button type="submit" className="login-button mt-4">
                        ENTRAR
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
