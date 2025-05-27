
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Patient } from '@/types/patient';

interface ExcelImportProps {
  onImport: (patients: Omit<Patient, 'id' | 'contactHistory'>[]) => void;
  onCancel: () => void;
}

interface ImportRow {
  nome?: string;
  telefone?: string;
  telefoneSecundario?: string;
  ultimaConsulta?: string;
  proximoContato?: string;
  motivoProximoContato?: string;
  status?: string;
  isValid: boolean;
  errors: string[];
}

export const ExcelImport: React.FC<ExcelImportProps> = ({ onImport, onCancel }) => {
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const validateRow = (row: any): ImportRow => {
    const errors: string[] = [];
    
    if (!row.nome || typeof row.nome !== 'string') {
      errors.push('Nome é obrigatório');
    }
    
    if (!row.telefone || typeof row.telefone !== 'string') {
      errors.push('Telefone é obrigatório');
    }
    
    if (!row.ultimaConsulta) {
      errors.push('Data da última consulta é obrigatória');
    }
    
    if (!row.proximoContato) {
      errors.push('Data do próximo contato é obrigatória');
    }

    return {
      nome: row.nome,
      telefone: row.telefone,
      telefoneSecundario: row.telefoneSecundario,
      ultimaConsulta: row.ultimaConsulta,
      proximoContato: row.proximoContato,
      motivoProximoContato: row.motivoProximoContato || 'Consulta de rotina',
      status: row.status || 'active',
      isValid: errors.length === 0,
      errors
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const processedData = jsonData.map((row: any) => validateRow(row));
        setImportData(processedData);

        toast({
          title: "Planilha processada",
          description: `${processedData.length} linhas encontradas. Verifique os dados antes de importar.`,
        });
      } catch (error) {
        toast({
          title: "Erro ao processar planilha",
          description: "Verifique se o arquivo está no formato correto.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    const validRows = importData.filter(row => row.isValid);
    
    if (validRows.length === 0) {
      toast({
        title: "Nenhum dado válido",
        description: "Corrija os erros antes de importar.",
        variant: "destructive",
      });
      return;
    }

    const patients: Omit<Patient, 'id' | 'contactHistory'>[] = validRows.map(row => ({
      name: row.nome!,
      phone: row.telefone!,
      secondaryPhone: row.telefoneSecundario,
      lastVisit: new Date(row.ultimaConsulta!),
      nextContactDate: new Date(row.proximoContato!),
      nextContactReason: row.motivoProximoContato!,
      status: row.status as 'active' | 'inactive'
    }));

    onImport(patients);
  };

  const validCount = importData.filter(row => row.isValid).length;
  const invalidCount = importData.length - validCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-dental-primary text-white">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Planilha Excel
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {importData.length === 0 ? (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-dental-accent rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-dental-primary mb-4" />
                <h3 className="text-lg font-semibold text-dental-primary mb-2">
                  Selecione sua planilha Excel
                </h3>
                <p className="text-dental-secondary mb-4">
                  Formatos aceitos: .xlsx, .xls
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="max-w-xs mx-auto"
                />
              </div>

              <div className="bg-dental-background p-4 rounded-lg">
                <h4 className="font-semibold text-dental-primary mb-2">
                  Formato esperado da planilha:
                </h4>
                <div className="text-sm text-dental-secondary space-y-1">
                  <p><strong>nome:</strong> Nome completo do paciente</p>
                  <p><strong>telefone:</strong> Telefone principal</p>
                  <p><strong>telefoneSecundario:</strong> Telefone alternativo (opcional)</p>
                  <p><strong>ultimaConsulta:</strong> Data da última consulta (DD/MM/AAAA)</p>
                  <p><strong>proximoContato:</strong> Data do próximo contato (DD/MM/AAAA)</p>
                  <p><strong>motivoProximoContato:</strong> Motivo do contato (opcional)</p>
                  <p><strong>status:</strong> active ou inactive (opcional, padrão: active)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {validCount} válidos
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive">
                      <XCircle className="w-4 h-4 mr-1" />
                      {invalidCount} com erro
                    </Badge>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <div className="space-y-2 p-4">
                  {importData.map((row, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        row.isValid 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{row.nome || 'Nome inválido'}</p>
                          <p className="text-sm text-gray-600">{row.telefone || 'Telefone inválido'}</p>
                        </div>
                        <div className="text-right">
                          {row.isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-5 h-5 text-red-500" />
                              <div className="text-xs text-red-600">
                                {row.errors.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={validCount === 0}
                  className="bg-dental-primary hover:bg-dental-secondary"
                >
                  Importar {validCount} pacientes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
