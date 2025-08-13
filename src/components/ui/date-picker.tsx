import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, useNavigation } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";

interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = "Selecionar data",
  className,
  disabled = false
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [showYearPicker, setShowYearPicker] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(selected || new Date());
  const [yearRangeStart, setYearRangeStart] = React.useState(
    Math.floor((selected || new Date()).getFullYear() / 10) * 10
  );

  React.useEffect(() => {
    if (selected) {
      setInputValue(format(selected, 'dd/MM/yyyy', { locale: ptBR }));
      setViewMonth(selected);
    } else {
      setInputValue("");
    }
  }, [selected]);

  React.useEffect(() => {
    if (showYearPicker) {
      setYearRangeStart(Math.floor(viewMonth.getFullYear() / 10) * 10);
    }
  }, [showYearPicker, viewMonth]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Tentar fazer parse da data digitada
    if (value.length === 10) { // dd/mm/yyyy
      const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        onSelect?.(parsedDate);
        setViewMonth(parsedDate);
      }
    } else if (value === "") {
      onSelect?.(undefined);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSelect?.(date);
      setOpen(false);
    }
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(viewMonth);
    newDate.setFullYear(year);
    setViewMonth(newDate);
    setShowYearPicker(false);
  };

  const generateYears = () => {
    const years = [];
    for (let i = yearRangeStart; i < yearRangeStart + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const YearPicker = () => (
    <div className="p-3 pointer-events-auto">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setYearRangeStart((prev) => prev - 10)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {yearRangeStart} - {yearRangeStart + 9}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setYearRangeStart((prev) => prev + 10)}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {generateYears().map((year) => (
          <Button
            key={year}
            variant={year === viewMonth.getFullYear() ? "default" : "ghost"}
            size="sm"
            onClick={() => handleYearSelect(year)}
            className="h-8 text-sm"
            type="button"
          >
            {year}
          </Button>
        ))}
      </div>
    </div>
  );

  const CustomCaption = ({ displayMonth }: { displayMonth: Date }) => {
    const { nextMonth, previousMonth, goToMonth } = useNavigation();
    return (
      <div className="flex items-center justify-between px-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => previousMonth && goToMonth(previousMonth)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowYearPicker(!showYearPicker)}
          className="text-sm font-medium hover:bg-accent"
          type="button"
        >
          {format(displayMonth, 'MMMM yyyy', { locale: ptBR })}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => nextMonth && goToMonth(nextMonth)}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={cn(
              "pr-10",
              !selected && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setOpen(!open)}
            disabled={disabled}
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {showYearPicker ? (
          <YearPicker />
        ) : (
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDateSelect}
            month={viewMonth}
            onMonthChange={setViewMonth}
            className="p-3 pointer-events-auto"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
              ),
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
              IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
              Caption: CustomCaption,
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}