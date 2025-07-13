import React from 'react';
import { Button } from '@/components/ui/button';

interface PatientFormActionsProps {
  onCancel: () => void;
  isEditing: boolean;
  disabled: boolean;
}

export const PatientFormActions: React.FC<PatientFormActionsProps> = ({
  onCancel,
  isEditing,
  disabled
}) => {
  return (
    <div className="flex gap-2 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        className="flex-1 bg-dental-primary hover:bg-dental-secondary"
        disabled={disabled}
      >
        {isEditing ? 'Atualizar' : 'Salvar'}
      </Button>
    </div>
  );
};