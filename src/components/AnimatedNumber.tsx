"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
}

/** Counts up smoothly to the given value whenever it changes. */
export default function AnimatedNumber({ value, format }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (latest) => format(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.9, ease: "easeOut" });
    return () => controls.stop();
  }, [value, motionValue]);

  return <motion.span>{text}</motion.span>;
}