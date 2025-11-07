import { Badge } from "lucide-react";


export function RoleBadge({ role }: { role?: string }) {
  const label = (role ?? "user").toLowerCase();
  const variant = label === "admin" ? "destructive" : "secondary";
  return <Badge var iant={variant} className="uppercase">{label}</Badge>;
}
