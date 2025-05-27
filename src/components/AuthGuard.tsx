
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: React.ReactNode;
}

const ADMIN_PASSWORD = 'dental2024'; // Em produção, usar Supabase para segurança real

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const auth = localStorage.getItem('dental_auth');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoading(true);
    
    // Simular delay de autenticação
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        localStorage.setItem('dental_auth', 'authenticated');
        toast({
          title: "Acesso autorizado",
          description: "Bem-vinda ao sistema de gestão de pacientes!",
        });
      } else {
        toast({
          title: "Senha incorreta",
          description: "Verifique sua senha e tente novamente.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dental_auth');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-dental-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-dental-primary rounded-full flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-dental-primary">Gestão de Pacientes</CardTitle>
            <p className="text-dental-secondary text-sm">Digite sua senha para acessar</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dental-secondary w-4 h-4" />
              <Input
                type="password"
                placeholder="Senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="pl-10 border-dental-primary/30 focus:border-dental-primary"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={isLoading || !password}
              className="w-full bg-dental-primary hover:bg-dental-secondary"
            >
              {isLoading ? 'Verificando...' : 'Entrar'}
            </Button>
            <p className="text-xs text-dental-secondary text-center">
              Senha demo: dental2024
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="border-dental-primary text-dental-primary hover:bg-dental-primary hover:text-white"
        >
          Sair
        </Button>
      </div>
      {children}
    </div>
  );
};
