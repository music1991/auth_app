"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function PasswordField({ 
  value, 
  onChange, 
  disabled = false,
  placeholder = "Password",
  className = ""
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShow = () => {
    if (!disabled) {
      setShowPassword((prev) => !prev);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full border border-gray-300 p-2 pr-10 rounded-md
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${disabled ? 'bg-gray-100' : 'bg-white'}
        `}
        suppressHydrationWarning
      />
      <button
        type="button"
        onClick={toggleShow}
        disabled={disabled}
        className={`
          absolute right-3 top-1/2 -translate-y-1/2 
          text-gray-500 hover:text-gray-700 
          transition-colors duration-200
          disabled:opacity-30 disabled:cursor-not-allowed
          p-1 rounded hover:bg-gray-100
        `}
        suppressHydrationWarning
      >
        {showPassword ? (
          <EyeOff size={18} className="min-w-[18px]" />
        ) : (
          <Eye size={18} className="min-w-[18px]" />
        )}
      </button>
    </div>
  );
}