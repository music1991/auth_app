import { CheckCircle2, Circle } from "lucide-react";

export default function RequirementsList({
  rules,
}: {
  rules: { len: boolean; lower: boolean; upper: boolean; number: boolean; dot: boolean; match: boolean };
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-sm space-y-1">
      <Req ok={rules.match} label="Passwords match" />
      <div className="h-px bg-gray-200 my-2" />
      <Req ok={rules.len} label="At least 8 characters" />
      <Req ok={rules.lower} label="At least one lowercase letter" />
      <Req ok={rules.upper} label="At least one uppercase letter" />
      <Req ok={rules.number} label="At least one number" />
      <Req ok={rules.dot} label='Must include a dot "."' />
    </div>
  );
}

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "inline-flex h-5 w-5 items-center justify-center rounded-full",
          ok ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400",
        ].join(" ")}
        aria-hidden
      >
        {ok ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </span>
      <span className={ok ? "text-emerald-700" : "text-gray-600"}>{label}</span>
    </div>
  );
}
