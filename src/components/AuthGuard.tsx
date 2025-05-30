
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Chrome } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-dental-primary/20">
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 border-4 border-dental-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-dental-secondary">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dental-background via-white to-dental-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-dental-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-dental-primary rounded-full flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-dental-primary">Gestão de Pacientes</CardTitle>
            <p className="text-dental-secondary text-sm">Sistema privado e seguro</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full bg-dental-primary hover:bg-dental-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <Chrome className="w-4 h-4" />
              {loading ? 'Conectando...' : 'Entrar com Google'}
            </Button>
            <p className="text-xs text-dental-secondary text-center">
              Acesso restrito para usuários autorizados
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <span className="text-sm text-dental-secondary bg-white/80 px-2 py-1 rounded">
          {user.email}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="border-dental-primary text-dental-primary hover:bg-dental-primary hover:text-white"
        >
          Sair
        </Button>
      </div>
      {children}
    </div>
  );
};
