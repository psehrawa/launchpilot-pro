"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

// Simple toast implementation
let toastListeners: ((toast: Toast) => void)[] = [];

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const newToast: Toast = { id, title, description, variant };
      
      // For now, just use console + alert for simplicity
      // In production, you'd use a proper toast library like sonner
      if (variant === "destructive") {
        console.error(`${title}: ${description}`);
      } else {
        console.log(`${title}: ${description}`);
      }
      
      // Show a quick notification
      if (typeof window !== "undefined") {
        const el = document.createElement("div");
        el.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm animate-in slide-in-from-bottom-5 ${
          variant === "destructive" ? "bg-red-600 text-white" : "bg-slate-900 text-white"
        }`;
        el.innerHTML = `
          <p class="font-medium">${title}</p>
          ${description ? `<p class="text-sm opacity-90">${description}</p>` : ""}
        `;
        document.body.appendChild(el);
        setTimeout(() => {
          el.classList.add("animate-out", "slide-out-to-right-5");
          setTimeout(() => el.remove(), 200);
        }, 3000);
      }
    },
    []
  );

  return { toast };
}
