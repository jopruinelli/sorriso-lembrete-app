import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  EspecialidadeOption,
  getEspecialidadesByCargoId,
  createEspecialidadeIfMissing,
} from '@/services/especialidades';
import { X } from 'lucide-react';

interface Props {
  cargoId: string | null;
  value: EspecialidadeOption[];
  onChange: (v: EspecialidadeOption[]) => void;
  allowCreateEspecialidade?: boolean;
}

export const EspecialidadeMultiSelect: React.FC<Props> = ({
  cargoId,
  value,
  onChange,
  allowCreateEspecialidade = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<EspecialidadeOption[]>([]);
  const isMobile = useIsMobile();

  // load options with debounce
  useEffect(() => {
    if (!cargoId) return;
    const handler = setTimeout(async () => {
      const data = await getEspecialidadesByCargoId(cargoId, search);
      setOptions(data);
    }, 250);
    return () => clearTimeout(handler);
  }, [cargoId, search]);

  const selectedIds = useMemo(() => value.map(v => v.id), [value]);

  const handleSelect = (opt: EspecialidadeOption) => {
    if (selectedIds.includes(opt.id)) {
      onChange(value.filter(v => v.id !== opt.id));
    } else {
      onChange([...value, opt]);
    }
  };

  const handleRemove = (id: string) => {
    onChange(value.filter(v => v.id !== id));
  };

  const handleCreate = async (name: string) => {
    if (!cargoId) return;
    const newOpt = await createEspecialidadeIfMissing(cargoId, name);
    onChange([...value, newOpt]);
  };

  const clearAll = () => onChange([]);

  const content = (
    <Command>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Buscar especialidade..."
      />
      <CommandList className="max-h-64 overflow-y-auto">
        <CommandEmpty>Nenhuma especialidade encontrada</CommandEmpty>
        <CommandGroup>
          {options.map(opt => (
            <CommandItem
              key={opt.id}
              onSelect={() => handleSelect(opt)}
              value={opt.nome}
            >
              {opt.nome}
              {selectedIds.includes(opt.id) && (
                <X className="ml-auto h-4 w-4" />
              )}
            </CommandItem>
          ))}
          {allowCreateEspecialidade && search && !options.some(o => o.nome.toLowerCase() === search.toLowerCase()) && (
            <CommandItem onSelect={() => handleCreate(search)}>
              Adicionar "{search}"
            </CommandItem>
          )}
          <CommandItem onSelect={clearAll}>Limpar</CommandItem>
          <CommandItem onSelect={() => setOpen(false)}>
            Não informar agora
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between"
      disabled={!cargoId}
    >
      {value.length === 0 ? 'Selecionar especialidades' : `${value.length} selecionada(s)`}
    </Button>
  );

  return (
    <div className="space-y-2">
      {!cargoId && (
        <p className="text-sm text-muted-foreground">
          Selecione o cargo para ver especialidades (opcional)
        </p>
      )}
      {cargoId && options.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Não se aplica para este cargo
        </p>
      )}
      {cargoId && (
        isMobile ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{trigger}</SheetTrigger>
            <SheetContent side="bottom" className="p-0">
              {content}
            </SheetContent>
          </Sheet>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className="p-0 w-80">
              {content}
            </PopoverContent>
          </Popover>
        )
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.map(opt => (
            <Badge key={opt.id} variant="secondary" className="pr-1">
              {opt.nome}
              <button
                type="button"
                onClick={() => handleRemove(opt.id)}
                className="ml-1 rounded-full hover:bg-muted"
                aria-label={`Remover ${opt.nome}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
