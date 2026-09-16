import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { Matcher } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseISODate(value?: string) {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MESES_ABREV = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

function formatShort(date: Date) {
  return `${date.getDate()} / ${MESES_ABREV[date.getMonth()]} / ${date.getFullYear()}`;
}

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  /** "short" = "9 / set / 2025", útil cuando el campo comparte fila angosta con otro. */
  displayFormat?: "long" | "short";
}

// Selector de fecha con calendario visual (Popover + react-day-picker) en vez
// de un input type="date" desnudo — más fácil de ubicarse que tipear/contar
// dígitos, sobre todo para agendar a varios días o semanas de distancia.
export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  id,
  disabled,
  minDate,
  maxDate,
  className,
  displayFormat = "long",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);

  const disabledMatcher: Matcher[] = [];
  if (minDate) disabledMatcher.push({ before: minDate });
  if (maxDate) disabledMatcher.push({ after: maxDate });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !selected && "text-slate-400",
            className
          )}
        >
          <CalendarIcon className="size-4 text-slate-400 shrink-0" />
          {selected
            ? displayFormat === "short"
              ? formatShort(selected)
              : selected.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(toISODate(date));
            setOpen(false);
          }}
          disabled={disabledMatcher.length ? disabledMatcher : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
