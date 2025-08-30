import React, { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { AppNavigation } from '@/components/AppNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { Professional } from '@/types/professional';

const roleOptions = [
  { id: 'dentist', label: 'Dentista' },
  { id: 'assistant', label: 'Assistente' },
  { id: 'reception', label: 'Recepcionista' }
];

const specialtyOptions: Record<string, string[]> = {
  dentist: ['Clínico Geral', 'Ortodontia', 'Implantodontia'],
  assistant: ['Financeiro', 'Agenda / Secretaria'],
  reception: ['Atendimento ao Cliente']
};

const locationOptions = [
  { id: 'loc1', name: 'Clínica Central' },
  { id: 'loc2', name: 'Unidade Norte' }
];

const Team: React.FC = () => {
  const { user, loading: authLoading, signOut } = useSupabaseAuth();
  const { userProfile, loading: orgLoading } = useOrganization(user);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Professional, 'id'>>({
    firstName: '',
    lastName: '',
    user: '',
    role: '',
    specialties: [],
    locations: []
  });

  const toggleSpecialty = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec]
    }));
  };

  const toggleLocation = (loc: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(loc)
        ? prev.locations.filter(l => l !== loc)
        : [...prev.locations, loc]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfessional: Professional = {
      id: Date.now().toString(),
      ...formData,
    };
    setProfessionals(prev => [...prev, newProfessional]);
    setFormData({ firstName: '', lastName: '', user: '', role: '', specialties: [], locations: [] });
    setShowForm(false);
  };

  if (authLoading || orgLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <AuthGuard>
      <AppNavigation
        userProfile={userProfile}
        onSettingsClick={() => {}}
        onSignOut={signOut}
        topBarContent="Equipe"
      >
        <div className="space-y-4">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-dental-primary hover:bg-dental-secondary"
          >
            Adicionar Profissional
          </Button>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="user">Usuário</Label>
                <Input
                  id="user"
                  value={formData.user}
                  onChange={e => setFormData({ ...formData, user: e.target.value })}
                  placeholder="E-mail ou nome de usuário"
                />
              </div>

              <div>
                <Label>Cargo *</Label>
                <Select
                  value={formData.role}
                  onValueChange={value => setFormData({ ...formData, role: value, specialties: [] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.role && (
                <div>
                  <Label>Especialidade</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialtyOptions[formData.role]?.map(spec => (
                      <div key={spec} className="flex items-center space-x-2">
                        <Checkbox
                          id={`spec-${spec}`}
                          checked={formData.specialties.includes(spec)}
                          onCheckedChange={() => toggleSpecialty(spec)}
                        />
                        <Label htmlFor={`spec-${spec}`}>{spec}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Local / Clínica</Label>
                <div className="flex flex-wrap gap-2">
                  {locationOptions.map(loc => (
                    <div key={loc.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`loc-${loc.id}`}
                        checked={formData.locations.includes(loc.id)}
                        onCheckedChange={() => toggleLocation(loc.id)}
                      />
                      <Label htmlFor={`loc-${loc.id}`}>{loc.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-dental-primary hover:bg-dental-secondary">Salvar</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {professionals.length === 0 ? (
            <p className="text-dental-secondary">Nenhum profissional cadastrado.</p>
          ) : (
            professionals.map(prof => (
              <Card key={prof.id}>
                <CardHeader>
                  <CardTitle>{prof.firstName} {prof.lastName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="font-semibold">Cargo:</span> {roleOptions.find(r => r.id === prof.role)?.label}</p>
                  {prof.specialties.length > 0 && (
                    <p><span className="font-semibold">Especialidade:</span> {prof.specialties.join(', ')}</p>
                  )}
                  {prof.locations.length > 0 && (
                    <p><span className="font-semibold">Local/Clínica:</span> {prof.locations.map(id => locationOptions.find(l => l.id === id)?.name).join(', ')}</p>
                  )}
                  {prof.user && (
                    <p><span className="font-semibold">Usuário:</span> {prof.user}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </AppNavigation>
    </AuthGuard>
  );
};

export default Team;
