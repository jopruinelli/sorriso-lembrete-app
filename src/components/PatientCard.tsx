
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/types/patient';
import { OrganizationSettings } from '@/types/organization';
import { Phone, MessageSquare, Calendar, Edit, Clock, AlertTriangle } from 'lucide-react';
import { format, isBefore, isAfter, startOfToday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientCardProps {
  patient: Patient;
  organizationSettings?: OrganizationSettings | null;
  onEdit: (patient: Patient) => void;
  onContact: (patient: Patient) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  organizationSettings,
  onEdit, 
  onContact 
}) => {
  const today = startOfToday();
  const isOverdue = isBefore(patient.nextContactDate, today);
  const isDueSoon = !isOverdue && isBefore(patient.nextContactDate, addDays(today, 7));

  const getStatusColor = () => {
    if (isOverdue) return 'border-l-red-500 bg-red-50';
    if (isDueSoon) return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-dental-primary bg-white';
  };

  const getStatusIcon = () => {
    if (isOverdue) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (isDueSoon) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <Calendar className="w-4 h-4 text-dental-primary" />;
  };

  const formatWhatsAppMessage = (message: string) => {
    return message
      .replace('{nome_do_paciente}', patient.name)
      .replace('{data_proximo_contato}', format(patient.nextContactDate, 'dd/MM/yyyy', { locale: ptBR }));
  };

  const handleWhatsAppClick = () => {
    const defaultMessage = organizationSettings?.whatsapp_default_message || 
      'Olá {nome_do_paciente}! Este é um lembrete da sua consulta marcada para {data_proximo_contato}. Aguardamos você!';
    
    const message = formatWhatsAppMessage(defaultMessage);
    const whatsappUrl = `https://wa.me/55${patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneClick = () => {
    window.open(`tel:${patient.phone}`, '_self');
  };

  return (
    <Card className={`mb-3 border-l-4 ${getStatusColor()} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-dental-primary">{patient.name}</h3>
              {getStatusIcon()}
            </div>
            <p className="text-sm text-dental-secondary mb-1">{patient.phone}</p>
            {patient.secondaryPhone && (
              <p className="text-xs text-dental-secondary">
                Tel. 2: {patient.secondaryPhone}
              </p>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(patient)}
            className="text-dental-secondary hover:text-dental-primary"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-dental-primary" />
            <span className="text-dental-secondary">Última consulta:</span>
            <span className="font-medium text-dental-primary">
              {format(patient.lastVisit, 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            <span className="text-dental-secondary">Próximo contato:</span>
            <span className={`font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-dental-primary'}`}>
              {format(patient.nextContactDate, 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>

          <div className="text-sm text-dental-secondary">
            <strong>Motivo:</strong> {patient.nextContactReason}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant={patient.paymentType === 'particular' ? 'default' : 'secondary'} className="text-xs">
              {patient.paymentType === 'particular' ? 'Particular' : 'Convênio'}
            </Badge>
            {patient.contactHistory.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {patient.contactHistory.length} contatos
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePhoneClick}
              className="border-dental-primary text-dental-primary hover:bg-dental-background"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppClick}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => onContact(patient)}
              className="bg-dental-primary hover:bg-dental-secondary text-white"
            >
              Contato
            </Button>
          </div>
        </div>

        {isOverdue && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Contato em atraso!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
