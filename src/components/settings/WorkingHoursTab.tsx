import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { OrganizationSettings } from '@/types/organization';

interface WorkingHoursTabProps {
  organizationSettings: OrganizationSettings | null;
  onUpdateSettings: (
    updates: Partial<Pick<OrganizationSettings, 'working_hours_start' | 'working_hours_end'>>
  ) => void;
}

export const WorkingHoursTab: React.FC<WorkingHoursTabProps> = ({
  organizationSettings,
  onUpdateSettings,
}) => {
  const [start, setStart] = useState<number>(
    Number(organizationSettings?.working_hours_start ?? 8)
  );
  const [end, setEnd] = useState<number>(
    Number(organizationSettings?.working_hours_end ?? 18)
  );

  useEffect(() => {
    setStart(Number(organizationSettings?.working_hours_start ?? 8));
    setEnd(Number(organizationSettings?.working_hours_end ?? 18));
  }, [organizationSettings]);

  // Generate 15 minute increments across 24 hours (0, 0.25, ..., 23.75)
  const hours = Array.from({ length: 24 * 4 }, (_, i) => i * 0.25);

  const formatHour = (hour: number) => {
    const h = Math.floor(hour).toString().padStart(2, '0');
    const m = Math.round((hour % 1) * 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleSave = () => {
    if (start < end) {
      onUpdateSettings({ working_hours_start: start, working_hours_end: end });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-dental-primary">Horários da Agenda</CardTitle>
        <CardDescription>
          Defina o intervalo de horários úteis visíveis na agenda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Início</Label>
            <Select value={start.toString()} onValueChange={(v) => setStart(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((h) => (
                  <SelectItem key={h} value={h.toString()}>
                    {formatHour(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Fim</Label>
            <Select value={end.toString()} onValueChange={(v) => setEnd(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((h) => (
                  <SelectItem key={h} value={h.toString()}>
                    {formatHour(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleSave} disabled={start >= end}>
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
};
