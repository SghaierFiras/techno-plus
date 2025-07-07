import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }: ToastOptions) => {
    // Create toast element
    const toastElement = document.createElement('div');
    toastElement.className = `
      fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
      ${variant === 'destructive' 
        ? 'bg-red-500 text-white' 
        : 'bg-green-500 text-white'
      }
      transform translate-x-full transition-transform duration-300
    `;
    
    toastElement.innerHTML = `
      <div class="font-medium">${title}</div>
      ${description ? `<div class="text-sm opacity-90 mt-1">${description}</div>` : ''}
    `;

    // Add to DOM
    document.body.appendChild(toastElement);

    // Animate in
    setTimeout(() => {
      toastElement.classList.remove('translate-x-full');
    }, 100);

    // Remove after duration
    setTimeout(() => {
      toastElement.classList.add('translate-x-full');
      setTimeout(() => {
        if (toastElement.parentNode) {
          toastElement.parentNode.removeChild(toastElement);
        }
      }, 300);
    }, duration);
  }, []);

  return { toast };
} 