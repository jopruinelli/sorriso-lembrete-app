
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types/organization';
import { UserApprovalService } from '@/services/userApprovalService';
import { useToast } from '@/hooks/use-toast';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

interface UserApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}

export const UserApprovalModal: React.FC<UserApprovalModalProps> = ({
  isOpen,
  onClose,
  organizationId
}) => {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const users = await UserApprovalService.getPendingUsers(organizationId);
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários pendentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await UserApprovalService.approveUser(userId);
      toast({
        title: "Usuário aprovado",
        description: "O usuário foi aprovado com sucesso",
      });
      loadPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Erro",
        description: "Falha ao aprovar usuário",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await UserApprovalService.rejectUser(userId);
      toast({
        title: "Usuário rejeitado",
        description: "A solicitação foi rejeitada",
      });
      loadPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Erro",
        description: "Falha ao rejeitar usuário",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPendingUsers();
    }
  }, [isOpen, organizationId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dental-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            Aprovação de Usuários
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-dental-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pendingUsers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto text-dental-secondary mb-4" />
              <p className="text-dental-secondary">
                Não há usuários aguardando aprovação
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-dental-primary">{user.name}</CardTitle>
                      <CardDescription>ID: {user.user_id}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(user.user_id)}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleReject(user.user_id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
