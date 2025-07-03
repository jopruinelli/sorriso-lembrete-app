
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Patient } from '@/types/patient';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  tipoAtendimento?: string;
  ultimaConsultaDate?: Date;
  proximoContatoDate?: Date;
  isValid: boolean;
  errors: string[];
}

export const ExcelImport: React.FC<ExcelImportProps> = ({ onImport, onCancel }) => {
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseDate = (dateString: string | number): Date | null => {
    console.log('🔍 Tentando parsear data:', dateString, 'tipo:', typeof dateString);
    
    if (!dateString && dateString !== 0) return null;
    
    // Se for um número, pode ser um serial date do Excel
    if (typeof dateString === 'number') {
      console.log('📊 Detectado número do Excel:', dateString);
      
      // Serial dates do Excel começam em 1/1/1900 (mas consideram 1900 como ano bissexto erroneamente)
      // Por isso usamos 1/1/1900 como base e subtraímos 1 dia
      if (dateString > 1 && dateString < 100000) { // Range razoável para datas
        const excelEpoch = new Date(1900, 0, 1); // 1 de janeiro de 1900
        const result = new Date(excelEpoch.getTime() + (dateString - 2) * 24 * 60 * 60 * 1000);
        if (isValid(result) && result.getFullYear() > 1900 && result.getFullYear() < 2100) {
          console.log('✅ Data convertida do Excel serial:', dateString, '->', result);
          return result;
        }
      }
    }
    
    // Converter para string se for número que não funcionou como serial date
    let dateStr = dateString.toString().trim();
    
    if (!dateStr || dateStr === '') return null;
    
    // Formatos aceitos priorizando DD/MM/YYYY
    const dateFormats = [
      'dd/MM/yyyy',    // Formato brasileiro preferido: 01/02/2025
      'dd/MM/yy',      // Formato brasileiro com ano de 2 dígitos: 01/02/25
      'd/M/yyyy',      // Sem zeros à esquerda: 1/2/2025
      'd/M/yy',        // Sem zeros à esquerda com ano 2 dígitos: 1/2/25
      'dd-MM-yyyy',    // Com hífen
      'dd-MM-yy',      
      'MM/dd/yyyy',    // Formato americano
      'MM/dd/yy',      
      'yyyy-MM-dd',    // ISO
      'yyyy/MM/dd'
    ];
    
    // Tentar parsear com diferentes formatos
    for (const formatStr of dateFormats) {
      try {
        console.log(`⚙️ Tentando formato: ${formatStr} para "${dateStr}"`);
        const parsed = parse(dateStr, formatStr, new Date());
        if (isValid(parsed) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
          console.log(`✅ Data parseada com sucesso: ${dateStr} -> ${parsed} usando formato ${formatStr}`);
          return parsed;
        }
      } catch (error) {
        console.log(`❌ Erro no formato ${formatStr}:`, error);
      }
    }
    
    console.error('❌ Não foi possível parsear a data:', dateStr);
    return null;
  };

  const validateRow = (row: any): ImportRow => {
    const errors: string[] = [];
    
    console.log('🔍 Validando linha:', row);
    
    if (!row.nome || typeof row.nome !== 'string' || row.nome.trim() === '') {
      errors.push('Nome é obrigatório');
    }
    
    if (!row.telefone || typeof row.telefone !== 'string' || row.telefone.trim() === '') {
      errors.push('Telefone é obrigatório');
    }
    
    const ultimaConsultaDate = parseDate(row.ultimaConsulta);
    if (!ultimaConsultaDate) {
      errors.push(`Data da última consulta inválida: "${row.ultimaConsulta}"`);
    }
    
    const proximoContatoDate = parseDate(row.proximoContato);
    if (!proximoContatoDate) {
      errors.push(`Data do próximo contato inválida: "${row.proximoContato}"`);
    }

    console.log('📊 Resultado da validação:', {
      nome: row.nome,
      ultimaConsultaOriginal: row.ultimaConsulta,
      ultimaConsultaParsed: ultimaConsultaDate,
      proximoContatoOriginal: row.proximoContato,
      proximoContatoParsed: proximoContatoDate,
      errors
    });

    return {
      nome: row.nome?.trim(),
      telefone: row.telefone?.toString().trim(),
      telefoneSecundario: row.telefoneSecundario?.toString().trim(),
      ultimaConsulta: row.ultimaConsulta?.toString(),
      proximoContato: row.proximoContato?.toString(),
      ultimaConsultaDate,
      proximoContatoDate,
      motivoProximoContato: row.motivoProximoContato || 'Consulta de rotina',
      status: row.status || 'active',
      tipoAtendimento: row.tipoAtendimento || 'particular',
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
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: false, // Não converter automaticamente para evitar problemas
          dateNF: 'dd/mm/yyyy' // Formato de data esperado
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: true, // Manter valores originais
          defval: '' // Valor padrão para células vazias
        });

        console.log('📊 Dados brutos importados da planilha:', jsonData);

        const processedData = jsonData.map((row: any, index: number) => {
          console.log(`🔄 Processando linha ${index + 1}:`, row);
          return validateRow(row);
        });
        
        setImportData(processedData);

        console.log('✅ Dados processados para preview:', processedData);

        toast({
          title: "Planilha processada",
          description: `${processedData.length} linhas encontradas. Verifique os dados antes de importar.`,
        });
      } catch (error) {
        console.error('❌ Erro ao processar planilha:', error);
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
      secondaryPhone: row.telefoneSecundario || undefined,
      lastVisit: row.ultimaConsultaDate!,
      nextContactDate: row.proximoContatoDate!,
      nextContactReason: row.motivoProximoContato!,
      status: row.status as 'active' | 'inactive' | 'closed',
      paymentType: row.tipoAtendimento as 'particular' | 'convenio',
      created_at: new Date(),
      updated_at: new Date(),
      updated_by: undefined
    }));

    console.log('📤 Pacientes finais a serem importados:', patients);
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
                  <p><strong>tipoAtendimento:</strong> particular ou convenio (opcional, padrão: particular)</p>
                  <p><strong>status:</strong> active, inactive ou closed (opcional, padrão: active)</p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800 font-medium">
                    💡 Dica: Use sempre o formato DD/MM/AAAA para datas (ex: 01/02/2025)
                  </p>
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
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{row.nome || 'Nome inválido'}</p>
                          <p className="text-sm text-gray-600">{row.telefone || 'Telefone inválido'}</p>
                          {row.telefoneSecundario && (
                            <p className="text-xs text-gray-500">Tel. secundário: {row.telefoneSecundario}</p>
                          )}
                          <p className="text-xs text-gray-500">Tipo: {row.tipoAtendimento || 'particular'}</p>
                        </div>
                        <div className="text-right">
                          {row.isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                        <div>
                          <strong>Última consulta:</strong><br />
                          <span className="text-xs text-gray-500">Original: {row.ultimaConsulta}</span><br />
                          {row.ultimaConsultaDate 
                            ? <span className="text-green-600">✅ {format(row.ultimaConsultaDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                            : <span className="text-red-600">❌ Data inválida</span>
                          }
                        </div>
                        <div>
                          <strong>Próximo contato:</strong><br />
                          <span className="text-xs text-gray-500">Original: {row.proximoContato}</span><br />
                          {row.proximoContatoDate 
                            ? <span className="text-green-600">✅ {format(row.proximoContatoDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                            : <span className="text-red-600">❌ Data inválida</span>
                          }
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <strong>Motivo:</strong> {row.motivoProximoContato}
                      </div>
                      
                      {row.errors.length > 0 && (
                        <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                          <strong>Erros:</strong> {row.errors.join(', ')}
                        </div>
                      )}
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
