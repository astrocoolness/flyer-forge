import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-press",
  {
    variants: {
      variant: {
        primary: "bg-paper text-ink hover:bg-paper-dim",
        quiet: "bg-panel text-paper hover:bg-panel-2",
        ghost: "bg-transparent text-paper hover:bg-panel",
        line: "border border-line bg-transparent text-paper hover:bg-panel",
      },
      size: {
        md: "h-11 px-3",
        sm: "h-10 px-2.5",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "quiet", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
