
import React, { useState } from 'react';
import { Patient, ContactRecord } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Phone, MessageSquare, User, Calendar, CalendarIcon } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContactFormProps {
  patient: Patient;
  onSave: (contactRecord: Omit<ContactRecord, 'id'>, nextContactDate?: Date) => void;
  onCancel: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ patient, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    notes: '',
    scheduleNext: true,
    nextContactPeriod: '6months' as '1month' | '6months' | '1year',
    customDate: undefined as Date | undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const contactRecord: Omit<ContactRecord, 'id'> = {
      date: new Date(),
      method: 'whatsapp', // Default method
      notes: formData.notes,
      successful: true // Default successful
    };

    let nextContactDate: Date | undefined;
    if (formData.scheduleNext) {
      if (formData.customDate) {
        nextContactDate = formData.customDate;
      } else {
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
              <Label htmlFor="notes">Observações do contato</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Agendou consulta para próxima semana, precisa remarcar, não atendeu..."
                rows={3}
              />
            </div>

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
                <div className="space-y-3">
                  <Label>Período para próximo contato</Label>
                  <Select 
                    value={formData.nextContactPeriod} 
                    onValueChange={(value: '1month' | '6months' | '1year') => {
                      setFormData(prev => ({ ...prev, nextContactPeriod: value, customDate: undefined }));
                    }}
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
                  
                  <div>
                    <Label>Ou escolha uma data específica</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Input
                          type="date"
                          value={formData.customDate ? format(formData.customDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, customDate: e.target.value ? new Date(e.target.value) : undefined }))}
                          className="w-full"
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.customDate}
                          onSelect={(date) => setFormData(prev => ({ ...prev, customDate: date }))}
                          disabled={(date) => date < new Date()}
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={new Date().getFullYear() + 10}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

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
