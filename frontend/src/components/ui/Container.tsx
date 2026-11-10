import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The semantic HTML element or React component to render.
   * Defaults to 'div'. Can be 'section', 'main', 'header', 'footer', 'article', etc.
   */
  as?: React.ElementType;
  /**
   * Additional custom Tailwind classes to merge.
   */
  className?: string;
  /**
   * Children nodes to render inside the container.
   */
  children: React.ReactNode;
  /**
   * Maximum content width tier:
   * - 'default': max-w-[1280px] (official Rose Champagne luxury container limit)
   * - 'narrow': max-w-[960px] (for longform editorial copy, terms/privacy, auth cards)
   * - 'wide': max-w-[1440px] (for full-bleed photo discovery grids)
   * - 'full': w-full (fluid width with standard gutters)
   */
  size?: "default" | "narrow" | "wide" | "full";
  /**
   * Whether to include the standard responsive horizontal gutters.
   * Default: true (px-4 on mobile, sm:px-6 on tablet, lg:px-8 on desktop).
   */
  gutters?: boolean;
}

/**
 * Reusable Max Content Width Container Component
 *
 * Enforces the Rose Champagne Design System 1280px desktop container constraint:
 * `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8`
 *
 * Automatically merges additional classes using `twMerge(clsx(...))` to prevent Tailwind class conflicts.
 */
export function Container({
  as: Component = "div",
  className,
  children,
  size = "default",
  gutters = true,
  ...props
}: ContainerProps) {
  const sizeClasses = {
    default: "max-w-[1280px]",
    narrow: "max-w-[960px]",
    wide: "max-w-[1440px]",
    full: "w-full",
  };

  const gutterClasses = gutters ? "px-4 sm:px-6 lg:px-8" : "";

  return (
    <Component
      className={twMerge(
        clsx("w-full mx-auto", sizeClasses[size], gutterClasses, className)
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Container;
