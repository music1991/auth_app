export function RoleBadge({ role }: { role?: string }) {
  const label = (role ?? "user").toLowerCase();
  const isAdmin = label === "admin";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
      isAdmin ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
    }`}>
      {label}
    </span>
  );
}
