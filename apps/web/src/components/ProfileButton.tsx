"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, Settings } from "lucide-react";
import { ClientLogoutButton } from "./ClientLogoutButton";

export function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón con solo ícono - Borde más oscuro y hover hermoso */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-7 border-2 border-gray-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <User className="w-5 h-5 text-gray-500 transition-colors duration-200" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-300 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Opciones con hover hermoso */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:translate-x-1"
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </Link>

          {/* Logout con hover hermoso */}
          <div>
            <ClientLogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}