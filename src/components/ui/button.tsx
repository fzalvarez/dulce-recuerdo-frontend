import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center select-none justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
  {
    variants: {
      variant: {
        default:
          "bg-brand-500 text-white hover:bg-brand-700 active:scale-[0.98] shadow-sm",
        outline:
          "border border-slate-300 bg-white text-slate-900 hover:bg-brand-50 hover:border-brand-500",
        "outline-brand":
          "border border-brand-200 bg-white text-brand-500 hover:bg-brand-50",
        soft: "bg-slate-50 text-brand-500 hover:bg-brand-50",
        ghost: "text-slate-600 hover:bg-brand-50 hover:text-brand-500",
        operational:
          "bg-operational text-white hover:bg-emerald-600 active:scale-[0.98] shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        link: "text-brand-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-9",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
