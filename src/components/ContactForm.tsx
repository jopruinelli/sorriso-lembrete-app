
import React, { useState } from 'react';
import { Patient, ContactRecord } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Phone, MessageSquare, User, Calendar } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactFormProps {
  patient: Patient;
  onSave: (contactRecord: Omit<ContactRecord, 'id'>, nextContactDate?: Date) => void;
  onCancel: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ patient, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    method: 'whatsapp' as ContactRecord['method'],
    notes: '',
    successful: true,
    scheduleNext: true,
    nextContactPeriod: '6months' as '1month' | '6months' | '1year'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const contactRecord: Omit<ContactRecord, 'id'> = {
      date: new Date(),
      method: formData.method,
      notes: formData.notes,
      successful: formData.successful
    };

    let nextContactDate: Date | undefined;
    if (formData.scheduleNext && formData.successful) {
      const today = new Date();
      switch (formData.nextContactPeriod) {
        case '1month':
          nextContactDate = addMonths(today, 1);
          break;
        case '6months':
          nextContactDate = addMonths(today, 6);
          break;
        case '1year':
          nextContactDate = addYears(today, 1);
          break;
      }
    }

    onSave(contactRecord, nextContactDate);
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = patient.phone.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    const message = "Olá tudo bem? Aqui é do consultório da dra. Gabriela Cechinatto. Estamos entrando em contato para agendar um retorno para você";
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Registrar Contato</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">{patient.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Calendar className="w-4 h-4" />
              <span>Próximo contato: {format(patient.nextContactDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          </div>

          {/* Botão do WhatsApp */}
          <div className="mb-4">
            <Button
              onClick={handleWhatsAppClick}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              type="button"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Método de contato</Label>
              <Select 
                value={formData.method} 
                onValueChange={(value: ContactRecord['method']) => setFormData(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="phone">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Ligação
                    </div>
                  </SelectItem>
                  <SelectItem value="in-person">Pessoalmente</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Contato foi bem-sucedido?</Label>
              <Select 
                value={formData.successful.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, successful: value === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">✅ Sim, consegui falar</SelectItem>
                  <SelectItem value="false">❌ Não atendeu / Não respondeu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Observações do contato</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Agendou consulta para próxima semana, precisa remarcar, não atendeu..."
                rows={3}
              />
            </div>

            {formData.successful && (
              <div className="space-y-3 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="scheduleNext"
                    checked={formData.scheduleNext}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduleNext: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="scheduleNext">Agendar próximo contato</Label>
                </div>

                {formData.scheduleNext && (
                  <div>
                    <Label>Período para próximo contato</Label>
                    <Select 
                      value={formData.nextContactPeriod} 
                      onValueChange={(value: '1month' | '6months' | '1year') => setFormData(prev => ({ ...prev, nextContactPeriod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1month">1 mês</SelectItem>
                        <SelectItem value="6months">6 meses</SelectItem>
                        <SelectItem value="1year">1 ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                Registrar Contato
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
