
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  periodFilter: string;
  onPeriodFilterChange: (period: string) => void;
  showOverdueOnly: boolean;
  onShowOverdueOnlyChange: (show: boolean) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  periodFilter,
  onPeriodFilterChange,
  showOverdueOnly,
  onShowOverdueOnlyChange
}) => {
  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dental-secondary w-4 h-4" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-dental-primary/30 focus:border-dental-primary"
        />
      </div>

      <div className="flex gap-2">
        <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
          <SelectTrigger className="flex-1 border-dental-primary/30">
            <Filter className="w-4 h-4 mr-2 text-dental-primary" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="thisMonth">Este mês</SelectItem>
            <SelectItem value="nextMonth">Próximo mês</SelectItem>
            <SelectItem value="overdue">Atrasados</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showOverdueOnly ? "default" : "outline"}
          onClick={() => onShowOverdueOnlyChange(!showOverdueOnly)}
          className={showOverdueOnly 
            ? "bg-dental-primary hover:bg-dental-secondary whitespace-nowrap" 
            : "border-dental-primary text-dental-primary hover:bg-dental-background whitespace-nowrap"
          }
        >
          Apenas atrasados
        </Button>
      </div>
    </div>
  );
};
