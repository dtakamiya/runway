import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 浮動小数点誤差を除去して小数第1位に丸める */
export function roundPt(val: number): number {
  return parseFloat(val.toFixed(1))
}
