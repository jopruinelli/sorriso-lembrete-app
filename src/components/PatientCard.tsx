
import React from 'react';
import { Patient } from '@/types/patient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Calendar, User, Edit } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientCardProps {
  patient: Patient;
  onEdit: (patient: Patient) => void;
  onContact: (patient: Patient) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onEdit, onContact }) => {
  const isOverdue = isBefore(patient.nextContactDate, new Date());
  const isDueSoon = isAfter(patient.nextContactDate, new Date()) && 
                    isBefore(patient.nextContactDate, addDays(new Date(), 7));

  const getUrgencyBadge = () => {
    if (isOverdue) return <Badge variant="destructive">Atrasado</Badge>;
    if (isDueSoon) return <Badge className="bg-orange-500">Em breve</Badge>;
    return <Badge variant="secondary">Em dia</Badge>;
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg text-gray-900">{patient.name}</h3>
          </div>
          <div className="flex gap-2">
            {getUrgencyBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(patient)}
              className="p-1 h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{patient.phone}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Última consulta: {format(patient.lastVisit, 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>

          <div className="text-sm text-gray-600">
            <strong>Próximo contato:</strong> {format(patient.nextContactDate, 'dd/MM/yyyy', { locale: ptBR })}
          </div>

          <div className="text-sm text-gray-600">
            <strong>Motivo:</strong> {patient.nextContactReason}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onContact(patient)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Contatar
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`tel:${patient.phone}`)}
            size="sm"
          >
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
