
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            variant === 'destructive' ? 'bg-red-100' : 'bg-dental-accent'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              variant === 'destructive' ? 'text-red-600' : 'text-dental-primary'
            }`} />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">{message}</p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-dental-primary text-dental-primary hover:bg-dental-background"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              className={variant === 'destructive' ? '' : 'bg-dental-primary hover:bg-dental-secondary'}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
