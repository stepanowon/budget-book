import type { ToastType } from '@/components/common/Toast';

type ToastHandler = (message: string, type: ToastType) => void;

let handler: ToastHandler | null = null;

export function registerToastHandler(fn: ToastHandler) {
  handler = fn;
}

export function emitToast(message: string, type: ToastType = 'error') {
  handler?.(message, type);
}
