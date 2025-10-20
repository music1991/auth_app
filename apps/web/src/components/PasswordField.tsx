"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";


export default function PasswordField({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) {
	const [showPassword, setShowPassword] = useState(false);

	const toggleShow = () => setShowPassword((prev) => !prev);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e);
		if (showPassword) setShowPassword(false);
	};

	return (
		<div className="relative w-full">
			<input
				type={showPassword ? "text" : "password"}
				placeholder="Password"
				value={value}
				onChange={handleChange}
				className="w-full border p-2 pr-10 rounded-md"
				suppressHydrationWarning
			/>
			<button
				type="button"
				onClick={toggleShow}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
				suppressHydrationWarning
			>
				{!showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
			</button>
		</div>
	);
}