import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, MapPin, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Location {
  id: string;
  organization_id: string;
  name: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const LocationsTab: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLocation, setNewLocation] = useState({ name: '', address: '' });
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { userProfile } = useOrganization(user);

  useEffect(() => {
    if (userProfile?.organization_id) {
      loadLocations();
    }
  }, [userProfile?.organization_id]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar locais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async () => {
    if (!newLocation.name.trim() || !userProfile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: newLocation.name.trim(),
          address: newLocation.address.trim() || null,
          organization_id: userProfile.organization_id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setLocations([...locations, data]);
      setNewLocation({ name: '', address: '' });
      toast({
        title: "Sucesso",
        description: "Local adicionado com sucesso",
      });
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar local",
        variant: "destructive",
      });
    }
  };

  const updateLocation = async (location: Location) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({
          name: location.name,
          address: location.address || null,
          is_active: location.is_active
        })
        .eq('id', location.id);

      if (error) throw error;

      setLocations(locations.map(l => l.id === location.id ? location : l));
      setEditingLocation(null);
      toast({
        title: "Sucesso",
        description: "Local atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar local",
        variant: "destructive",
      });
    }
  };

  const deleteLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      setLocations(locations.filter(l => l.id !== locationId));
      toast({
        title: "Sucesso",
        description: "Local removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover local",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando locais...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Gerenciar Locais</h3>
      </div>

      {/* Add new location */}
      <Card className="p-4">
        <h4 className="font-medium mb-4">Adicionar Novo Local</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="location-name">Nome do Local</Label>
            <Input
              id="location-name"
              value={newLocation.name}
              onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              placeholder="Ex: Clínica Centro"
            />
          </div>
          <div>
            <Label htmlFor="location-address">Endereço (opcional)</Label>
            <Textarea
              id="location-address"
              value={newLocation.address}
              onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
              placeholder="Ex: Rua das Flores, 123 - Centro"
              rows={2}
            />
          </div>
          <Button onClick={addLocation} disabled={!newLocation.name.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Local
          </Button>
        </div>
      </Card>

      {/* Locations list */}
      <div className="space-y-4">
        <h4 className="font-medium">Locais Cadastrados ({locations.length})</h4>
        
        {locations.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            Nenhum local cadastrado
          </Card>
        ) : (
          locations.map((location) => (
            <Card key={location.id} className="p-4">
              {editingLocation?.id === location.id ? (
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Local</Label>
                    <Input
                      value={editingLocation.name}
                      onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Textarea
                      value={editingLocation.address || ''}
                      onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingLocation.is_active}
                      onCheckedChange={(checked) => setEditingLocation({ ...editingLocation, is_active: checked })}
                    />
                    <Label>Local ativo</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateLocation(editingLocation)}>
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingLocation(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{location.name}</h5>
                      <Badge variant={location.is_active ? "default" : "secondary"}>
                        {location.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {location.address && (
                      <p className="text-sm text-muted-foreground mt-1">{location.address}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLocation(location)}
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
                            Tem certeza que deseja excluir o local "{location.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteLocation(location.id)}>
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