"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Plus,
  Shield,
  X,
} from "lucide-react";

interface TrainingLine {
  training_line_id: string;
  title: string;
  description: string | null;
  mandatory: boolean;
  total_items: number;
  completed_items: number;
  last_updated: string;
}

interface TrainingLineItem {
  id: string;
  item_type: "course" | "evaluation" | "task";
  order_index: number;
  item_title: string | null;
  course_id: string | null;
  evaluation_template_id: string | null;
  task_template_id: string | null;
}

interface Certification {
  id: string;
  title: string;
  issuer: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  credential_url: string | null;
  file_url: string | null;
  verified: boolean;
  course_title: string | null;
  created_at: string;
}

const ITEM_TYPE_CONFIG = {
  course: { icon: BookOpen, label: "Curso", color: "text-blue-500" },
  evaluation: { icon: FileText, label: "Evaluación", color: "text-amber-500" },
  task: { icon: ClipboardList, label: "Tarea", color: "text-violet-500" },
};

function formatDate(date?: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-semibold text-gray-600">{value}/{max}</span>
    </div>
  );
}

function TrainingLineCard({ line }: { line: TrainingLine }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<TrainingLineItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const pct = line.total_items > 0 ? Math.round((line.completed_items / line.total_items) * 100) : 0;
  const done = line.completed_items >= line.total_items && line.total_items > 0;

  const toggleExpand = async () => {
    if (!expanded && items.length === 0) {
      setLoadingItems(true);
      try {
        const res = await fetch(`/api/training/lines/${line.training_line_id}/items`);
        const data = await res.json();
        setItems(data.items || []);
      } catch {
        // silent
      } finally {
        setLoadingItems(false);
      }
    }
    setExpanded((v) => !v);
  };

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all ${done ? "border-emerald-200" : "border-gray-200"}`}>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              {line.mandatory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  <Lock size={10} />
                  Obligatoria
                </span>
              )}
              {done && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 size={10} />
                  Completada
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">{line.title}</h3>
            {line.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{line.description}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold text-gray-900">{pct}%</p>
            <p className="text-[11px] text-gray-400">{line.completed_items} de {line.total_items} pasos</p>
          </div>
        </div>

        <ProgressBar value={line.completed_items} max={line.total_items} />

        <button
          type="button"
          onClick={toggleExpand}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
        >
          {loadingItems ? (
            <Loader2 size={13} className="animate-spin" />
          ) : expanded ? (
            <><ChevronUp size={13} /> Ocultar pasos</>
          ) : (
            <><ChevronDown size={13} /> Ver pasos ({line.total_items})</>
          )}
        </button>
      </div>

      {expanded && items.length > 0 && (
        <div className="border-t border-gray-100 p-5 pt-4">
          <div className="space-y-2">
            {items.map((item, idx) => {
              const config = ITEM_TYPE_CONFIG[item.item_type];
              const Icon = config.icon;
              const isCompleted = idx < line.completed_items;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                    isCompleted ? "bg-emerald-50/60" : "bg-gray-50"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCompleted ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {isCompleted ? <CheckCircle2 size={13} /> : idx + 1}
                  </span>
                  <Icon size={14} className={config.color} />
                  <span className={`flex-1 text-sm ${isCompleted ? "text-emerald-700 line-through" : "text-gray-700"}`}>
                    {item.item_title || config.label}
                  </span>
                  <span className={`text-[10px] font-medium uppercase rounded-full px-1.5 py-0.5 ${
                    isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CertificationCard({ cert }: { cert: Certification }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${cert.verified ? "border-emerald-200" : "border-gray-200"}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cert.verified ? "bg-emerald-50" : "bg-gray-50"}`}>
            <Award size={18} className={cert.verified ? "text-emerald-500" : "text-gray-400"} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{cert.title}</p>
            {cert.issuer && <p className="text-xs text-gray-500">{cert.issuer}</p>}
          </div>
        </div>
        {cert.verified && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
            <Shield size={9} />
            Verificado
          </span>
        )}
      </div>
      {cert.course_title && (
        <p className="mb-2 text-xs text-gray-400 line-clamp-1">
          <span className="font-medium">Curso:</span> {cert.course_title}
        </p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{formatDate(cert.issued_date)}</p>
        {(cert.credential_url || cert.file_url) && (
          <a
            href={cert.credential_url || cert.file_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 transition"
          >
            Ver certificado
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

function AddCertificationModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !credentialUrl.trim()) return;
    try {
      setSaving(true);
      const res = await fetch("/api/training/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, issuer, issuedDate, credentialUrl }),
      });
      if (!res.ok) throw new Error();
      onAdded();
      onClose();
    } catch {
      alert("No se pudo guardar la certificación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Agregar certificación</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nombre del certificado *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
              placeholder="AWS Solutions Architect"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Emisor</label>
            <input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
              placeholder="Amazon Web Services"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Fecha de emisión</label>
            <input
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Link de verificación *</label>
            <input
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
              required
              type="url"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500"
              placeholder="https://credentials.example.com/cert"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 transition"
          >
            {saving ? "Guardando..." : "Guardar certificación"}
          </button>
        </form>
      </div>
    </div>
  );
}

type PanelTab = "training" | "certifications";

export default function UserTrainingPanel() {
  const [tab, setTab] = useState<PanelTab>("training");
  const [lines, setLines] = useState<TrainingLine[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCert, setShowAddCert] = useState(false);

  const fetchLines = async () => {
    const res = await fetch("/api/training/enrollments");
    const data = await res.json();
    setLines(data.lines || []);
  };

  const fetchCertifications = async () => {
    const res = await fetch("/api/training/certifications");
    const data = await res.json();
    setCertifications(data.certifications || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLines(), fetchCertifications()]);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-1">
        <div className="h-8 w-48 rounded-xl bg-gray-200" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-gray-900">Mi formación</h2>
          <p className="text-sm text-gray-500">
            {lines.length} línea{lines.length !== 1 ? "s" : ""} de formación asignada{lines.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("training")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              tab === "training"
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-500 hover:text-gray-700"
            }`}
          >
            <GraduationCap size={15} />
            Líneas de formación
            <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-gray-600 border border-gray-200">
              {lines.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("certifications")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              tab === "certifications"
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-500 hover:text-gray-700"
            }`}
          >
            <Award size={15} />
            Certificaciones
            <span className="rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-gray-600 border border-gray-200">
              {certifications.length}
            </span>
          </button>
        </div>

        {tab === "training" && (
          <div className="space-y-3">
            {lines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
                <GraduationCap size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Sin líneas de formación asignadas</p>
                <p className="mt-1 text-xs text-gray-400">El administrador te asignará planes de formación</p>
              </div>
            ) : (
              lines.map((line) => <TrainingLineCard key={line.training_line_id} line={line} />)
            )}
          </div>
        )}

        {tab === "certifications" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddCert(true)}
                className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition"
              >
                <Plus size={15} />
                Agregar certificación
              </button>
            </div>

            {certifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
                <Award size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Sin certificaciones registradas</p>
                <p className="mt-1 text-xs text-gray-400">Agregá tus certificados con el botón de arriba</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {certifications.map((cert) => (
                  <CertificationCard key={cert.id} cert={cert} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddCert && (
        <AddCertificationModal
          onClose={() => setShowAddCert(false)}
          onAdded={fetchCertifications}
        />
      )}
    </>
  );
}
