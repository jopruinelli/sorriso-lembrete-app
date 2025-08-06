import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Tag, Edit, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AppointmentTitle {
  id: string;
  organization_id: string;
  title: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface AppointmentTitlesTabProps {
  fetchTitles: () => Promise<void>;
}

export const AppointmentTitlesTab: React.FC<AppointmentTitlesTabProps> = ({ fetchTitles }) => {
  const [titles, setTitles] = useState<AppointmentTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState<AppointmentTitle | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { userProfile } = useOrganization(user);

  useEffect(() => {
    if (userProfile?.organization_id) {
      loadTitles();
    }
  }, [userProfile?.organization_id]);

  const loadTitles = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_titles')
        .select('*')
        .order('title');

      if (error) throw error;
      setTitles(data || []);
    } catch (error) {
      console.error('Error loading titles:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar títulos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTitle = async () => {
    if (!newTitle.trim() || !userProfile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('appointment_titles')
        .insert({
          title: newTitle.trim(),
          organization_id: userProfile.organization_id,
          is_active: true,
          is_default: titles.length === 0 // First title becomes default
        })
        .select()
        .single();

      if (error) throw error;

      setTitles([...titles, data]);
      setNewTitle('');
      toast({
        title: "Sucesso",
        description: "Título adicionado com sucesso",
      });
      fetchTitles();
    } catch (error) {
      console.error('Error adding title:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar título",
        variant: "destructive",
      });
    }
  };

  const updateTitle = async (title: AppointmentTitle) => {
    try {
      const { error } = await supabase
        .from('appointment_titles')
        .update({
          title: title.title,
          is_active: title.is_active,
          is_default: title.is_default
        })
        .eq('id', title.id);

      if (error) throw error;

      setTitles(titles.map(t => t.id === title.id ? title : t));
      setEditingTitle(null);
      toast({
        title: "Sucesso",
        description: "Título atualizado com sucesso",
      });
      fetchTitles();
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar título",
        variant: "destructive",
      });
    }
  };

  const setAsDefault = async (titleId: string) => {
    try {
      const { error } = await supabase
        .from('appointment_titles')
        .update({ is_default: true })
        .eq('id', titleId);

      if (error) throw error;

      setTitles(titles.map(t => ({
        ...t,
        is_default: t.id === titleId
      })));

      toast({
        title: "Sucesso",
        description: "Título padrão atualizado",
      });
      fetchTitles();
    } catch (error) {
      console.error('Error setting default title:', error);
      toast({
        title: "Erro",
        description: "Erro ao definir título padrão",
        variant: "destructive",
      });
    }
  };

  const deleteTitle = async (titleId: string) => {
    try {
      const { error } = await supabase
        .from('appointment_titles')
        .delete()
        .eq('id', titleId);

      if (error) throw error;

      setTitles(titles.filter(t => t.id !== titleId));
      toast({
        title: "Sucesso",
        description: "Título removido com sucesso",
      });
      fetchTitles();
    } catch (error) {
      console.error('Error deleting title:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover título",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando títulos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Tag className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Gerenciar Títulos de Consulta</h3>
      </div>

      {/* Add new title */}
      <Card className="p-4">
        <h4 className="font-medium mb-4">Adicionar Novo Título</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title-name">Nome do Título</Label>
            <Input
              id="title-name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Consulta de Rotina"
            />
          </div>
          <Button onClick={addTitle} disabled={!newTitle.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Título
          </Button>
        </div>
      </Card>

      {/* Titles list */}
      <div className="space-y-4">
        <h4 className="font-medium">Títulos Cadastrados ({titles.length})</h4>
        
        {titles.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            Nenhum título cadastrado
          </Card>
        ) : (
          titles.map((title) => (
            <Card key={title.id} className="p-4">
              {editingTitle?.id === title.id ? (
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Título</Label>
                    <Input
                      value={editingTitle.title}
                      onChange={(e) => setEditingTitle({ ...editingTitle, title: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingTitle.is_active}
                      onCheckedChange={(checked) => setEditingTitle({ ...editingTitle, is_active: checked })}
                    />
                    <Label>Título ativo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingTitle.is_default}
                      onCheckedChange={(checked) => setEditingTitle({ ...editingTitle, is_default: checked })}
                    />
                    <Label>Título padrão</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateTitle(editingTitle)}>
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingTitle(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{title.title}</h5>
                      <div className="flex gap-1">
                        <Badge variant={title.is_active ? "default" : "secondary"}>
                          {title.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        {title.is_default && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <Star className="w-3 h-3 mr-1" />
                            Padrão
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!title.is_default && title.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAsDefault(title.id)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Padrão
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTitle(title)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o título "{title.title}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTitle(title.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};