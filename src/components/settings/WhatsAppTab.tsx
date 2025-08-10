
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UserProfile, OrganizationSettings } from '@/types/organization';

interface WhatsAppTabProps {
  userProfile: UserProfile | null;
  organizationSettings: OrganizationSettings | null;
  onUpdateSettings: (
    updates: {
      whatsapp_default_message: string;
      whatsapp_appointment_message: string;
    }
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

  useEffect(() => {
    setWhatsappMessage(organizationSettings?.whatsapp_default_message || '');
    setWhatsappAppointmentMessage(
      organizationSettings?.whatsapp_appointment_message || ''
    );
  }, [organizationSettings]);

  const handleSaveWhatsappMessage = () => {
    onUpdateSettings({
      whatsapp_default_message: whatsappMessage,
      whatsapp_appointment_message: whatsappAppointmentMessage,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dental-primary">Mensagens Padrão WhatsApp</CardTitle>
        <CardDescription>
          Configure as mensagens enviadas aos pacientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="whatsappMessage">Mensagem de Retomada</Label>
          <Textarea
            id="whatsappMessage"
            value={whatsappMessage}
            onChange={(e) => setWhatsappMessage(e.target.value)}
            placeholder="Digite sua mensagem padrão..."
            rows={4}
            disabled={userProfile?.role !== 'admin'}
          />
          <p className="text-xs text-dental-secondary mt-2">
            Variáveis disponíveis: {'{nome_do_paciente}'}, {'{primeiro_nome_do_paciente}'}, {'{data_proximo_contato}'}
          </p>
        </div>
        <div>
          <Label htmlFor="whatsappAppointmentMessage">Mensagem de Lembrete de Consulta</Label>
          <Textarea
            id="whatsappAppointmentMessage"
            value={whatsappAppointmentMessage}
            onChange={(e) => setWhatsappAppointmentMessage(e.target.value)}
            placeholder="Digite a mensagem de lembrete..."
            rows={4}
            disabled={userProfile?.role !== 'admin'}
          />
          <p className="text-xs text-dental-secondary mt-2">
            Variáveis disponíveis: {'{nome_do_paciente}'}, {'{primeiro_nome_do_paciente}'}, {'{data_consulta}'}, {'{hora_consulta}'}
          </p>
        </div>
        {userProfile?.role === 'admin' && (
          <Button
            onClick={handleSaveWhatsappMessage}
            className="bg-dental-primary hover:bg-dental-secondary"
            disabled={
              !whatsappMessage.trim() ||
              !whatsappAppointmentMessage.trim() ||
              (whatsappMessage === organizationSettings?.whatsapp_default_message &&
                whatsappAppointmentMessage ===
                  organizationSettings?.whatsapp_appointment_message)
            }
          >
            Salvar Mensagem
          </Button>
        )}
        {userProfile?.role !== 'admin' && (
          <p className="text-sm text-amber-600">
            Apenas administradores podem editar a mensagem padrão.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
