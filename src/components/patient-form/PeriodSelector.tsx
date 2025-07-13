import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ContactPeriod } from '@/types/patient';

interface PeriodSelectorProps {
  onPeriodChange: (period: ContactPeriod) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ onPeriodChange }) => {
  const periods = [
    { value: '1month' as ContactPeriod, label: '1 mês' },
    { value: '3months' as ContactPeriod, label: '3 meses' },
    { value: '6months' as ContactPeriod, label: '6 meses' },
    { value: '1year' as ContactPeriod, label: '1 ano' }
  ];

  return (
    <div>
      <Label>Período para Próximo Contato</Label>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {periods.map((period) => (
          <Button
            key={period.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPeriodChange(period.value)}
            className="text-xs"
          >
            {period.label}
          </Button>
        ))}
      </div>
    </div>
  );
};