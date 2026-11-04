/**
 * ShaadiSnap AI — Restrained Luxury Micro-Interactions & Motion System
 *
 * Requirements:
 * - Restrained animations: 180ms - 300ms duration envelope
 * - Luxury easing: cubic-bezier(0.16, 1, 0.3, 1)
 * - Strict accessibility: Zero motion sickness, full @media (prefers-reduced-motion: reduce) support
 * - Eliminates excessive bouncy physics, rotations, heavy gradients, or cartoonish popups
 */

import { type Variants, type Transition } from "framer-motion";

// =============================================================================
// 1. Duration & Easing Design Tokens
// =============================================================================

export const MOTION_DURATIONS = {
  /** Fast (180ms): Button clicks, toggle switches, badge hovers, tooltips */
  fast: 0.18,
  /** Normal (240ms): Card hover lift, tab switches, dropdown reveals */
  normal: 0.24,
  /** Deliberate (300ms): Modal entries, mobile navigation drawer slide, processing stage progression */
  deliberate: 0.3,
} as const;

export const MOTION_EASINGS = {
  /** Luxury editorial deceleration curve: instant responsiveness with smooth, calm settle */
  luxury: [0.16, 1, 0.3, 1] as const,
  /** Smooth symmetrical ease for two-way modal dialogs */
  inOut: [0.4, 0, 0.2, 1] as const,
} as const;

// =============================================================================
// 2. Framer Motion Transition Factory (Reduced-Motion Aware)
// =============================================================================

/**
 * Returns a Framer Motion Transition config.
 * When `shouldReduceMotion` is true, the animation completes instantaneously (0.01s)
 * with linear easing to prevent any vestibular discomfort.
 */
export function getLuxuryTransition(
  duration: number = MOTION_DURATIONS.normal,
  shouldReduceMotion: boolean = false
): Transition {
  if (shouldReduceMotion) {
    return { duration: 0.01, ease: "linear" };
  }
  return {
    duration,
    ease: MOTION_EASINGS.luxury,
  };
}

// =============================================================================
// 3. Reusable Framer Motion Variants
// =============================================================================

/**
 * Subtle Opacity Fade (zero movement)
 */
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.luxury,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.luxury,
    },
  },
};

/**
 * Restrained Vertical Fade & Subtle Lift (max 8px - 12px translation)
 * When reduced motion is preferred, translates y: 0 to eliminate movement.
 */
export const fadeInUpVariants: Variants = {
  initial: (shouldReduceMotion: boolean = false) => ({
    opacity: 0,
    y: shouldReduceMotion ? 0 : 10,
  }),
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.deliberate,
      ease: MOTION_EASINGS.luxury,
    },
  },
  exit: (shouldReduceMotion: boolean = false) => ({
    opacity: 0,
    y: shouldReduceMotion ? 0 : -6,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.luxury,
    },
  }),
};

/**
 * Dialog / Modal Backdrop Overlay Variant
 */
export const modalOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.luxury,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.luxury,
    },
  },
};

/**
 * Dialog / Modal Content Card Variant
 * Subtle scale from 0.98 -> 1.0 (never 0.8 or 0.9 which causes visual distortion)
 */
export const modalContentVariants: Variants = {
  initial: (shouldReduceMotion: boolean = false) => ({
    opacity: 0,
    scale: shouldReduceMotion ? 1 : 0.98,
    y: shouldReduceMotion ? 0 : 8,
  }),
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.deliberate,
      ease: MOTION_EASINGS.luxury,
    },
  },
  exit: (shouldReduceMotion: boolean = false) => ({
    opacity: 0,
    scale: shouldReduceMotion ? 1 : 0.98,
    y: shouldReduceMotion ? 0 : 6,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.luxury,
    },
  }),
};

/**
 * Mobile Navigation Drawer Slide Variant
 * Slides in from the right edge with a smooth deceleration settle.
 * When reduced motion is preferred, cross-fades without translation.
 */
export const drawerVariants: Variants = {
  initial: (shouldReduceMotion: boolean = false) => ({
    x: shouldReduceMotion ? 0 : "100%",
    opacity: shouldReduceMotion ? 0 : 1,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.deliberate,
      ease: MOTION_EASINGS.luxury,
    },
  },
  exit: (shouldReduceMotion: boolean = false) => ({
    x: shouldReduceMotion ? 0 : "100%",
    opacity: shouldReduceMotion ? 0 : 1,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.luxury,
    },
  }),
};

/**
 * Staggered Container for Lists and Grids
 * Delivers an editorial rhythm without excessive waiting times
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

// =============================================================================
// 4. Pure CSS Micro-Interaction Utility Class Constants
// =============================================================================

/**
 * Standard Tailwind utility class presets for high-performance CSS micro-interactions.
 * Native browser acceleration with zero JS overhead and built-in `motion-reduce:` guards.
 */
export const CSS_MICRO_INTERACTIONS = {
  /**
   * Primary Button Hover & Tap
   * - 180ms smooth transition
   * - Subtle active tap scale down to 0.98
   * - Resets to transform-none when reduced motion is preferred
   */
  buttonPrimary:
    "transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#914C60] active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none",

  /**
   * Secondary Button Hover & Tap
   * - 180ms smooth transition
   * - Soft blush border/background fill
   */
  buttonSecondary:
    "transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#F1D5D5]/30 hover:border-[#A85D70] active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none",

  /**
   * Luxury Card Micro-Lift
   * - 240ms transition
   * - 2px lift (-translate-y-0.5)
   * - Warm Burgundy shadow elevation
   * - Resets transform and shadow when reduced motion is preferred
   */
  cardLift:
    "transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-2px_rgba(99,60,73,0.08),0_2px_6px_-1px_rgba(99,60,73,0.04)] motion-reduce:transform-none motion-reduce:transition-none",

  /**
   * Gallery Thumbnail Zoom on Hover
   * - Restrained 1.025x zoom (never 1.1x or 1.2x)
   */
  imageHoverZoom:
    "transition-transform duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025] motion-reduce:transform-none",

  /**
   * Tab & Filter Toggle
   * - 180ms fast color switch
   */
  tabSwitch:
    "transition-colors duration-[180ms] ease-out",

  /**
   * Accessible WCAG 2.2 AA Focus Ring
   */
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF8F3]",
} as const;
