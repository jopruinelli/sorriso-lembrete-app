import React from 'react';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';

interface DatePickerFieldProps {
  label: string;
  value?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onSelect,
  placeholder = "dd/mm/aaaa",
  required = false
}) => {
  return (
    <div>
      <Label>{label} {required && '*'}</Label>
      <DatePicker
        selected={value}
        onSelect={onSelect}
        placeholder={placeholder}
      />
    </div>
  );
};