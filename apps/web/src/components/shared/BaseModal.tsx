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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className={`bg-white w-full ${maxWidthClass} rounded-2xl shadow-2xl p-6`}>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
        <div className="flex justify-end gap-3 mt-6">{footer}</div>
      </div>
    </div>
  );
}