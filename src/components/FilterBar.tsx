
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Search,
  Calendar,
  CreditCard,
  User,
  UserCheck,
  UserX,
  UserMinus,
} from 'lucide-react';
import { ContactPeriod } from '@/types/patient';

interface FilterBarProps {
  statusFilter: 'all' | 'active' | 'inactive' | 'closed';
  setStatusFilter: (status: 'all' | 'active' | 'inactive' | 'closed') => void;
  contactPeriodFilter: ContactPeriod | 'all';
  setContactPeriodFilter: (period: ContactPeriod | 'all') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  paymentFilter: 'all' | 'particular' | 'convenio';
  setPaymentFilter: (payment: 'all' | 'particular' | 'convenio') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  setStatusFilter,
  contactPeriodFilter,
  setContactPeriodFilter,
  searchTerm,
  setSearchTerm,
  paymentFilter,
  setPaymentFilter
}) => {
  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dental-secondary w-4 h-4" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-dental-primary/30 focus:border-dental-primary"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 border-dental-primary/30">
            {statusFilter === 'active' ? (
              <UserCheck className="w-4 h-4 mr-2 text-dental-primary" />
            ) : statusFilter === 'inactive' ? (
              <UserX className="w-4 h-4 mr-2 text-dental-primary" />
            ) : statusFilter === 'closed' ? (
              <UserMinus className="w-4 h-4 mr-2 text-dental-primary" />
            ) : (
              <User className="w-4 h-4 mr-2 text-dental-primary" />
            )}
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-2" />Todos os status
              </span>
            </SelectItem>
            <SelectItem value="active">
              <span className="flex items-center">
                <UserCheck className="w-4 h-4 mr-2" />Ativos
              </span>
            </SelectItem>
            <SelectItem value="inactive">
              <span className="flex items-center">
                <UserX className="w-4 h-4 mr-2" />Inativos
              </span>
            </SelectItem>
            <SelectItem value="closed">
              <span className="flex items-center">
                <UserMinus className="w-4 h-4 mr-2" />Encerrados
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={contactPeriodFilter} onValueChange={setContactPeriodFilter}>
          <SelectTrigger className="w-full sm:w-52 border-dental-primary/30">
            <Calendar className="w-4 h-4 mr-2 text-dental-primary" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="overdue">Atrasados</SelectItem>
            <SelectItem value="1month">1 mês</SelectItem>
            <SelectItem value="3months">3 meses</SelectItem>
            <SelectItem value="6months">6 meses</SelectItem>
            <SelectItem value="1year">1 ano</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-56 border-dental-primary/30">
            <CreditCard className="w-4 h-4 mr-2 text-dental-primary" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pagamentos</SelectItem>
            <SelectItem value="particular">Particular</SelectItem>
            <SelectItem value="convenio">Convênio</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
