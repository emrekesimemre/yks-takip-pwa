"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import type { ReactNode } from "react";

const softEase: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function useSoftTransition(): Transition {
  const reduce = useReducedMotion();
  if (reduce) return { duration: 0 };
  return { duration: 0.15, ease: softEase };
}

type DropdownPanelProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
  role?: string;
};

export function DropdownPanel({
  open,
  children,
  className,
  role,
}: Readonly<DropdownPanelProps>) {
  const transition = useSoftTransition();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role={role}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={transition}
          className={className}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
