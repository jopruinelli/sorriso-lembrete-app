
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, X, Check } from 'lucide-react';
import { UserProfile, OrganizationSettings } from '@/types/organization';

interface WhatsAppTabProps {
  userProfile: UserProfile | null;
  organizationSettings: OrganizationSettings | null;
  onUpdateSettings: (
    updates: Partial<
      Pick<
        OrganizationSettings,
        | 'whatsapp_default_message'
        | 'whatsapp_appointment_message'
        | 'whatsapp_birthday_message'
      >
    >
  ) => void;
}

export const WhatsAppTab: React.FC<WhatsAppTabProps> = ({
  userProfile,
  organizationSettings,
  onUpdateSettings
}) => {
  const [whatsappMessage, setWhatsappMessage] = useState(
    organizationSettings?.whatsapp_default_message || ''
  );
  const [whatsappAppointmentMessage, setWhatsappAppointmentMessage] = useState(
    organizationSettings?.whatsapp_appointment_message || ''
  );
  const [whatsappBirthdayMessage, setWhatsappBirthdayMessage] = useState(
    organizationSettings?.whatsapp_birthday_message || ''
  );

  const [editDefault, setEditDefault] = useState(false);
  const [editAppointment, setEditAppointment] = useState(false);
  const [editBirthday, setEditBirthday] = useState(false);

  useEffect(() => {
    setWhatsappMessage(organizationSettings?.whatsapp_default_message || '');
    setWhatsappAppointmentMessage(
      organizationSettings?.whatsapp_appointment_message || ''
    );
    setWhatsappBirthdayMessage(
      organizationSettings?.whatsapp_birthday_message || ''
    );
  }, [organizationSettings]);

  const handleSaveDefault = () => {
    onUpdateSettings({ whatsapp_default_message: whatsappMessage });
    setEditDefault(false);
  };

  const handleSaveAppointment = () => {
    onUpdateSettings({ whatsapp_appointment_message: whatsappAppointmentMessage });
    setEditAppointment(false);
  };

  const handleSaveBirthday = () => {
    onUpdateSettings({ whatsapp_birthday_message: whatsappBirthdayMessage });
    setEditBirthday(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dental-primary">Mensagens Padrão WhatsApp</CardTitle>
        <CardDescription>
          Configure as mensagens enviadas aos pacientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsappMessage">Mensagem de Retomada</Label>
            {userProfile?.role === 'admin' && !editDefault && (
              <Button variant="ghost" size="icon" onClick={() => setEditDefault(true)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Textarea
            id="whatsappMessage"
            value={whatsappMessage}
            onChange={(e) => setWhatsappMessage(e.target.value)}
            placeholder="Digite sua mensagem padrão..."
            rows={4}
            disabled={!editDefault}
          />
          <p className="text-xs text-dental-secondary mt-2">
            Variáveis disponíveis: {'{nome_do_paciente}'}, {'{primeiro_nome_do_paciente}'}, {'{data_proximo_contato}'}
          </p>
          {editDefault && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSaveDefault} disabled={!whatsappMessage.trim()}>
                <Check className="w-4 h-4 mr-1" /> Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setWhatsappMessage(organizationSettings?.whatsapp_default_message || '');
                  setEditDefault(false);
                }}
              >
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsappAppointmentMessage">Mensagem de Lembrete de Consulta</Label>
            {userProfile?.role === 'admin' && !editAppointment && (
              <Button variant="ghost" size="icon" onClick={() => setEditAppointment(true)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Textarea
            id="whatsappAppointmentMessage"
            value={whatsappAppointmentMessage}
            onChange={(e) => setWhatsappAppointmentMessage(e.target.value)}
            placeholder="Digite a mensagem de lembrete..."
            rows={4}
            disabled={!editAppointment}
          />
          <p className="text-xs text-dental-secondary mt-2">
            Variáveis disponíveis: {'{nome_do_paciente}'}, {'{primeiro_nome_do_paciente}'}, {'{data_consulta}'}, {'{hora_consulta}'}, {'{local_de_atendimento}'}
          </p>
          {editAppointment && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSaveAppointment} disabled={!whatsappAppointmentMessage.trim()}>
                <Check className="w-4 h-4 mr-1" /> Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setWhatsappAppointmentMessage(organizationSettings?.whatsapp_appointment_message || '');
                  setEditAppointment(false);
                }}
              >
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsappBirthdayMessage">Mensagem de Lembrete de Aniversário</Label>
            {userProfile?.role === 'admin' && !editBirthday && (
              <Button variant="ghost" size="icon" onClick={() => setEditBirthday(true)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Textarea
            id="whatsappBirthdayMessage"
            value={whatsappBirthdayMessage}
            onChange={(e) => setWhatsappBirthdayMessage(e.target.value)}
            placeholder="Digite a mensagem de aniversário..."
            rows={4}
            disabled={!editBirthday}
          />
          <p className="text-xs text-dental-secondary mt-2">
            Variáveis disponíveis: {'{nome_do_paciente}'}, {'{primeiro_nome_do_paciente}'}, {'{data_aniversario}'}
          </p>
          {editBirthday && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSaveBirthday} disabled={!whatsappBirthdayMessage.trim()}>
                <Check className="w-4 h-4 mr-1" /> Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setWhatsappBirthdayMessage(organizationSettings?.whatsapp_birthday_message || '');
                  setEditBirthday(false);
                }}
              >
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </div>
          )}
        </div>

        {userProfile?.role !== 'admin' && (
          <p className="text-sm text-amber-600">
            Apenas administradores podem editar as mensagens padrão.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
