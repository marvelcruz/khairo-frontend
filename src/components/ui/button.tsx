"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "white" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  magnetic?: boolean;
  asChild?: boolean;
  href?: string;
  external?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-magenta text-pure-white hover:bg-magenta-deep shadow-[0_0_24px_rgba(236,0,140,0.4)] hover:shadow-[0_0_40px_rgba(236,0,140,0.6)]",
  secondary:
    "border-2 border-magenta text-magenta hover:bg-magenta hover:text-pure-white",
  ghost: "text-blush hover:text-pure-white hover:bg-white/10",
  white:
    "bg-pure-white text-ink-black hover:bg-off-white shadow-lg",
  outline:
    "border border-[var(--theme-border)] bg-transparent text-[var(--theme-text-secondary)] hover:border-magenta/50 hover:text-pure-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-xs sm:px-6",
  md: "h-11 px-5 text-sm sm:h-12 sm:px-8",
  lg: "h-12 px-6 text-sm sm:h-14 sm:px-10 sm:text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      magnetic = false,
      children,
      href,
      external,
      ...props
    },
    ref
  ) => {
    const magneticRef = React.useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 400, damping: 30 });
    const springY = useSpring(y, { stiffness: 400, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || !magneticRef.current) return;
      const rect = magneticRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set((e.clientX - centerX) * 0.3);
      y.set((e.clientY - centerY) * 0.3);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    const baseClasses = cn(
      "inline-flex items-center justify-center gap-2 rounded-[9999px] font-ui font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer select-none",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-magenta focus-visible:outline-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (href) {
      return (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className={baseClasses}
        >
          {children}
        </a>
      );
    }

    if (magnetic) {
      return (
        <motion.button
          ref={(node) => {
            (magneticRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          style={{ x: springX, y: springY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={baseClasses}
          whileTap={{ scale: 0.97 }}
          {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
        >
          {children}
        </motion.button>
      );
    }

    return (
      <button ref={ref} className={baseClasses} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
