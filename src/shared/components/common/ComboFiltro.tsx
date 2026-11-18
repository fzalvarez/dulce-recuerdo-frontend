import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Sin tildes y en minúsculas, para comparar "san" con "San Isidro" o "a" con "Ate". */
const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Elegir de una lista fija escribiendo: al escribir "S" quedan solo las opciones que empiezan
 * con "S". Flechas para moverse, Enter o Tab para elegir, Escape para cancelar.
 * Solo acepta valores de la lista; lo escrito que no coincide se descarta al salir.
 */
export function ComboFiltro({
  id,
  value,
  onChange,
  opciones,
  placeholder,
  className,
}: {
  id?: string;
  value: string | null;
  onChange: (v: string | null) => void;
  opciones: readonly string[];
  placeholder?: string;
  className?: string;
}) {
  const [texto, setTexto] = useState<string | null>(null); // null: no se está escribiendo
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);

  const filtro = normalizar(texto ?? "");
  const visibles = filtro ? opciones.filter((o) => normalizar(o).startsWith(filtro)) : [...opciones];

  const elegir = (opcion: string | null) => {
    onChange(opcion);
    setTexto(null);
    setAbierto(false);
  };

  // Al salir del campo: texto vacío quita el valor; si coincide con una sola opción, la elige.
  const confirmar = () => {
    if (texto === null) return setAbierto(false);
    if (!texto.trim()) return elegir(null);
    const exacta = opciones.find((o) => normalizar(o) === filtro);
    if (exacta) return elegir(exacta);
    if (visibles.length === 1) return elegir(visibles[0]);
    setTexto(null);
    setAbierto(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!abierto) return setAbierto(true);
      const paso = e.key === "ArrowDown" ? 1 : -1;
      setActivo((i) => (visibles.length ? (i + paso + visibles.length) % visibles.length : 0));
    } else if (e.key === "Enter" && abierto && visibles[activo]) {
      e.preventDefault(); // no enviar el formulario
      elegir(visibles[activo]);
    } else if (e.key === "Tab" && abierto && texto && visibles[activo]) {
      elegir(visibles[activo]); // escribió algo: Tab elige el resaltado y pasa al siguiente campo
    } else if (e.key === "Escape" && abierto) {
      e.preventDefault();
      e.stopPropagation(); // no cerrar el modal
      setTexto(null);
      setAbierto(false);
    }
  };

  return (
    <Popover open={abierto && visibles.length > 0}>
      <PopoverAnchor asChild>
        <div className={cn("relative", className)}>
          <Input
            id={id}
            role="combobox"
            aria-expanded={abierto}
            aria-autocomplete="list"
            autoComplete="off"
            value={texto ?? value ?? ""}
            placeholder={placeholder}
            className="h-9 pr-8"
            onFocus={(e) => {
              e.target.select();
              setActivo(Math.max(0, value ? opciones.indexOf(value) : 0));
              setAbierto(true);
            }}
            onClick={() => setAbierto(true)}
            onChange={(e) => {
              setTexto(e.target.value);
              setActivo(0);
              setAbierto(true);
            }}
            onKeyDown={onKeyDown}
            onBlur={confirmar}
          />
          <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) max-h-60 overflow-y-auto p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <ul role="listbox">
          {visibles.map((o, i) => (
            <li
              key={o}
              role="option"
              aria-selected={o === value}
              // mousedown evita que el input pierda el foco antes de elegir
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(o);
              }}
              onMouseEnter={() => setActivo(i)}
              className={cn(
                "cursor-pointer rounded-md px-2.5 py-1.5 text-sm",
                i === activo ? "bg-brand-50 text-brand-700" : "text-slate-700",
                o === value && "font-semibold"
              )}
            >
              {o}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
