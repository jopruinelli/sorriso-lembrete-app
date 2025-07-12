
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/types/organization';
import { UserManagementService } from '@/services/userManagementService';
import { useToast } from '@/hooks/use-toast';
import { Users, UserCheck, UserX, Trash2, Settings } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface UserManagementProps {
  organizationId: string;
  currentUserId: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  organizationId,
  currentUserId
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [userToRemove, setUserToRemove] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUsers = async () => {
    console.log('🔄 Loading users for organization:', organizationId);
    console.log('🔄 Current user ID:', currentUserId);
    
    try {
      setLoading(true);
      const organizationUsers = await UserManagementService.getOrganizationUsers(organizationId);
      console.log('✅ Users loaded successfully:', organizationUsers);
      setUsers(organizationUsers);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários da organização",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await UserManagementService.approveUser(userId);
      toast({
        title: "Usuário aprovado",
        description: "O usuário foi aprovado com sucesso",
      });
      loadUsers();
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
      await UserManagementService.rejectUser(userId);
      toast({
        title: "Usuário rejeitado",
        description: "A solicitação foi rejeitada",
      });
      loadUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Erro",
        description: "Falha ao rejeitar usuário",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await UserManagementService.removeUser(userId);
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido da organização",
      });
      loadUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover usuário",
        variant: "destructive",
      });
    }
  };

  const confirmRemoveUser = (userId: string) => {
    setUserToRemove(userId);
  };

  const handleConfirmRemove = async () => {
    if (!userToRemove) return;
    await handleRemove(userToRemove);
    setUserToRemove(null);
  };

  const handleCancelRemove = () => {
    setUserToRemove(null);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await UserManagementService.updateUserRole(userId, newRole);
      toast({
        title: "Função atualizada",
        description: "A função do usuário foi atualizada",
      });
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar função do usuário",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
        {role === 'admin' ? 'Administrador' : 'Usuário'}
      </Badge>
    );
  };

  useEffect(() => {
    if (organizationId) {
      loadUsers();
    } else {
      console.log('⚠️ No organizationId provided');
    }
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-dental-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-dental-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciamento de Usuários
          </CardTitle>
          <CardDescription>
            Gerencie todos os usuários da sua organização (Total: {users.length})
          </CardDescription>
        </CardHeader>
      </Card>

      {users.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto text-dental-secondary mb-4" />
            <p className="text-dental-secondary">
              Nenhum usuário encontrado na organização
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Organization ID: {organizationId}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-3">
                  {/* Header with name and badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="font-semibold text-dental-primary flex-1">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(user.status || 'approved')}
                      {getRoleBadge(user.role)}
                      {user.user_id === currentUserId && (
                        <Badge variant="outline" className="text-xs">
                          Você
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* User ID */}
                  <p className="text-sm text-dental-secondary truncate">
                    ID: {user.user_id}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    {/* Role Selection */}
                    {user.status === 'approved' && user.user_id !== currentUserId && (
                      <Select
                        value={user.role}
                        onValueChange={(value: 'admin' | 'user') => handleRoleChange(user.user_id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {user.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleApprove(user.user_id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                          >
                            <UserCheck className="w-4 h-4 mr-2 sm:mr-0" />
                            <span className="sm:hidden">Aprovar</span>
                          </Button>
                          <Button
                            onClick={() => handleReject(user.user_id)}
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                          >
                            <UserX className="w-4 h-4 mr-2 sm:mr-0" />
                            <span className="sm:hidden">Rejeitar</span>
                          </Button>
                        </>
                      )}

                      {user.status === 'approved' && user.user_id !== currentUserId && (
                        <Button
                          onClick={() => confirmRemoveUser(user.user_id)}
                          size="sm"
                          variant="destructive"
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Remover</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {userToRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remover usuário"
          message="Esta ação é irreversível. Deseja continuar?"
          confirmText="Remover"
          cancelText="Cancelar"
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
          variant="destructive"
        />
      )}
    </div>
  );
};
