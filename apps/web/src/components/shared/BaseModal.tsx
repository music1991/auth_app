"use client";

import type { ReactNode } from "react";

interface BaseModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  footer: ReactNode;
  maxWidthClass?: string;
}

export function BaseModal({
  open,
  title,
  children,
  footer,
  maxWidthClass = "max-w-md",
}: BaseModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className={`bg-card text-card-foreground border border-border w-full ${maxWidthClass} rounded-2xl shadow-2xl p-6`}>
        <h3 className="text-xl font-bold mb-4 text-foreground">{title}</h3>
        {children}
        <div className="flex justify-end gap-3 mt-6">{footer}</div>
      </div>
    </div>
  );
}