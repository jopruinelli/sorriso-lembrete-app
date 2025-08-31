import React, { useEffect, useState } from 'react';
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
import { CargoOption, getCargos } from '@/services/especialidades';

interface Props {
  value: CargoOption | null;
  onChange: (v: CargoOption | null) => void;
}

export const CargoSelect: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<CargoOption[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = setTimeout(async () => {
      const data = await getCargos(search);
      setOptions(data);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  const handleSelect = (opt: CargoOption) => {
    onChange(opt);
    setOpen(false);
  };

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between"
    >
      {value ? value.nome : 'Selecionar cargo'}
    </Button>
  );

  const content = (
    <Command>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Buscar cargo..."
      />
      <CommandList className="max-h-64 overflow-y-auto">
        <CommandEmpty>Nenhum cargo encontrado</CommandEmpty>
        <CommandGroup>
          {options.map(opt => (
            <CommandItem
              key={opt.id}
              value={opt.nome}
              onSelect={() => handleSelect(opt)}
            >
              {opt.nome}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  return (
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
  );
};
