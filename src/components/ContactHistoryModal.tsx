import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Patient, ContactRecord } from '@/types/patient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, MessageSquare, User, Clock } from 'lucide-react';

interface ContactHistoryModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactHistoryModal: React.FC<ContactHistoryModalProps> = ({
  patient,
  isOpen,
  onClose,
}) => {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'in-person':
        return <User className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'phone':
        return 'Telefone';
      case 'whatsapp':
        return 'WhatsApp';
      case 'in-person':
        return 'Presencial';
      case 'other':
        return 'Outro';
      default:
        return method;
    }
  };

  // Sort contacts by date (most recent first)
  const sortedContacts = [...patient.contactHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-dental-primary">
            Histórico de Contatos - {patient.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {sortedContacts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-dental-secondary">
                  Nenhum contato registrado ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedContacts.map((contact) => (
              <Card key={contact.id} className="border-l-4 border-l-dental-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getMethodIcon(contact.method)}
                      <span className="font-medium text-dental-primary">
                        {getMethodLabel(contact.method)}
                      </span>
                      <Badge 
                        variant={contact.successful ? "default" : "destructive"} 
                        className="text-xs"
                      >
                        {contact.successful ? 'Sucesso' : 'Sem sucesso'}
                      </Badge>
                    </div>
                    <span className="text-sm text-dental-secondary">
                      {format(contact.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>

                  {contact.notes && (
                    <div className="bg-dental-background/50 p-3 rounded-md">
                      <p className="text-sm text-dental-secondary whitespace-pre-wrap">
                        {contact.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};