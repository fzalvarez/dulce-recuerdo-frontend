import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("bg-white p-3", className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("es-PE", { month: "long" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 sm:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant, size: "icon-sm" }),
          "p-0 select-none text-slate-500 aria-disabled:opacity-40",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant, size: "icon-sm" }),
          "p-0 select-none text-slate-500 aria-disabled:opacity-40",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-8",
          defaultClassNames.month_caption
        ),
        caption_label: cn("text-sm font-semibold text-slate-900 select-none", defaultClassNames.caption_label),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-label uppercase font-semibold text-slate-400 select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-8 w-8 p-0 text-center select-none",
          defaultClassNames.day
        ),
        range_start: cn("rounded-l-md bg-brand-50", defaultClassNames.range_start),
        range_middle: cn("rounded-none bg-brand-50", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-brand-50", defaultClassNames.range_end),
        today: cn(
          "rounded-md bg-slate-100 text-slate-900 data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn("text-slate-300 aria-selected:text-slate-400", defaultClassNames.outside),
        disabled: cn("text-slate-300 opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          }
          return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon-sm"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "aspect-square h-8 w-8 min-w-8 flex-col gap-1 text-sm font-normal leading-none",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-brand-500/30",
        "data-[range-end=true]:rounded-md data-[range-end=true]:bg-brand-500 data-[range-end=true]:text-white",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-brand-50 data-[range-middle=true]:text-brand-700",
        "data-[range-start=true]:rounded-md data-[range-start=true]:bg-brand-500 data-[range-start=true]:text-white",
        "data-[selected-single=true]:bg-brand-500 data-[selected-single=true]:text-white data-[selected-single=true]:hover:bg-brand-700",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
