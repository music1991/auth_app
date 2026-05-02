"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Sector { id: number; name: string; }
interface Provider { id: number; name: string; website: string | null; contact: string | null; }
interface Course {
  id: string; title: string; description: string | null;
  source: "internal" | "external"; provider_name: string | null;
  duration_h: number | null; cost_per_user: number; currency: string;
}
interface TrainingLine {
  id: string; title: string; description: string | null;
  mandatory: boolean; total_items: number; sectors: string;
}
interface TrainingLineItem {
  id: string; item_type: "course" | "evaluation" | "task";
  order_index: number; item_title: string | null;
}
interface Enrollment { user_id: string; user_name: string; total_items: number; completed_items: number; }
interface AdminUser { id: string; name: string; email: string; }
interface EvalTemplate { id: string; title: string; }
interface TaskTemplate { id: string; title: string; }

type AdminTab = "lines" | "courses" | "providers" | "sectors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ITEM_TYPE_CONFIG = {
  course:     { icon: BookOpen,      label: "Curso",      color: "text-blue-500" },
  evaluation: { icon: FileText,      label: "Evaluación", color: "text-amber-500" },
  task:       { icon: ClipboardList, label: "Tarea",      color: "text-violet-500" },
};

function ConfirmDelete({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl text-center">
        <p className="mb-1 text-sm font-semibold text-gray-900">¿Eliminar?</p>
        <p className="mb-5 text-xs text-gray-500 line-clamp-2">{label}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 transition">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sectors Tab ──────────────────────────────────────────────────────────────

function SectorsTab() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Sector | null>(null);

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch("/api/training/sectors");
    const data = await res.json();
    setSectors(data.sectors || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/training/sectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName("");
    setSaving(false);
    fetch_();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/training/sectors/${id}`, { method: "DELETE" });
    setToDelete(null);
    fetch_();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nombre del sector" className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 transition">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Agregar
        </button>
      </form>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
      ) : sectors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">Sin sectores creados</div>
      ) : (
        <div className="space-y-2">
          {sectors.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
              <span className="text-sm font-medium text-gray-800">{s.name}</span>
              <button type="button" onClick={() => setToDelete(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {toDelete && <ConfirmDelete label={toDelete.name} onConfirm={() => handleDelete(toDelete.id)} onCancel={() => setToDelete(null)} />}
    </div>
  );
}

// ─── Providers Tab ────────────────────────────────────────────────────────────

function ProvidersTab() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", website: "", contact: "" });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Provider | null>(null);

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch("/api/training/providers");
    const data = await res.json();
    setProviders(data.providers || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/training/providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", website: "", contact: "" });
    setSaving(false);
    fetch_();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/training/providers/${id}`, { method: "DELETE" });
    setToDelete(null);
    fetch_();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Nombre del proveedor *" className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
        <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="Sitio web" className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
        <div className="flex gap-2">
          <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="Contacto" className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 transition">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          </button>
        </div>
      </form>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
      ) : providers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">Sin proveedores creados</div>
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                {p.website && <p className="text-xs text-gray-400">{p.website}</p>}
              </div>
              <button type="button" onClick={() => setToDelete(p)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {toDelete && <ConfirmDelete label={toDelete.name} onConfirm={() => handleDelete(toDelete.id)} onCancel={() => setToDelete(null)} />}
    </div>
  );
}

// ─── Courses Tab ──────────────────────────────────────────────────────────────

function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", source: "internal" as "internal" | "external", providerId: "", url: "", durationH: "", costPerUser: "0", currency: "ARS" });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Course | null>(null);

  const fetch_ = async () => {
    setLoading(true);
    const [cr, pr] = await Promise.all([fetch("/api/training/courses"), fetch("/api/training/providers")]);
    const [cd, pd] = await Promise.all([cr.json(), pr.json()]);
    setCourses(cd.courses || []);
    setProviders(pd.providers || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/training/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, providerId: form.providerId ? Number(form.providerId) : null, durationH: form.durationH ? Number(form.durationH) : null, costPerUser: Number(form.costPerUser) }),
    });
    setForm({ title: "", description: "", source: "internal", providerId: "", url: "", durationH: "", costPerUser: "0", currency: "ARS" });
    setShowForm(false);
    setSaving(false);
    fetch_();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/training/courses/${id}`, { method: "DELETE" });
    setToDelete(null);
    fetch_();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancelar" : "Nuevo curso"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-green-200 bg-green-50/40 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Título del curso *" className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 col-span-full" />
            <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as "internal" | "external" }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500">
              <option value="internal">Interno</option>
              <option value="external">Externo</option>
            </select>
            {form.source === "external" && (
              <select value={form.providerId} onChange={(e) => setForm((f) => ({ ...f, providerId: e.target.value }))} className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500">
                <option value="">Sin proveedor</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="URL del curso" className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
            <input value={form.durationH} onChange={(e) => setForm((f) => ({ ...f, durationH: e.target.value }))} type="number" min="0" placeholder="Duración (horas)" className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
            <div className="flex gap-2">
              <input value={form.costPerUser} onChange={(e) => setForm((f) => ({ ...f, costPerUser: e.target.value }))} type="number" min="0" placeholder="Costo por usuario" className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
              <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className="w-20 rounded-xl border border-gray-300 px-2 py-2 text-sm outline-none focus:border-green-500">
                <option>ARS</option><option>USD</option>
              </select>
            </div>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descripción" rows={2} className="col-span-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 transition">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Crear curso
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">Sin cursos creados</div>
      ) : (
        <div className="space-y-2">
          {courses.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <BookOpen size={14} className="text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                  <p className="text-xs text-gray-400">
                    {c.source === "external" ? `Externo${c.provider_name ? ` · ${c.provider_name}` : ""}` : "Interno"}
                    {c.duration_h ? ` · ${c.duration_h}h` : ""}
                    {c.cost_per_user > 0 ? ` · ${c.currency} ${c.cost_per_user}` : ""}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setToDelete(c)} className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {toDelete && <ConfirmDelete label={toDelete.title} onConfirm={() => handleDelete(toDelete.id)} onCancel={() => setToDelete(null)} />}
    </div>
  );
}

// ─── Training Lines Tab ───────────────────────────────────────────────────────

function AddItemModal({ lineId, onClose, onAdded }: { lineId: string; onClose: () => void; onAdded: () => void }) {
  const [itemType, setItemType] = useState<"course" | "evaluation" | "task">("course");
  const [courses, setCourses] = useState<Course[]>([]);
  const [evalTemplates, setEvalTemplates] = useState<EvalTemplate[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [orderIndex, setOrderIndex] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/training/courses").then((r) => r.json()),
      fetch("/api/dashboard/admin/evaluation-templates").then((r) => r.json()),
      fetch("/api/dashboard/admin/task-templates").then((r) => r.json()),
    ]).then(([cd, ed, td]) => {
      setCourses(cd.courses || []);
      setEvalTemplates(ed.templates || []);
      setTaskTemplates(td.templates || []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    await fetch(`/api/training/lines/${lineId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType,
        courseId: itemType === "course" ? selectedId : null,
        evaluationTemplateId: itemType === "evaluation" ? selectedId : null,
        taskTemplateId: itemType === "task" ? selectedId : null,
        orderIndex,
      }),
    });
    setSaving(false);
    onAdded();
    onClose();
  };

  const options = itemType === "course" ? courses : itemType === "evaluation" ? evalTemplates : taskTemplates;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Agregar ítem</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(["course", "evaluation", "task"] as const).map((t) => {
                const cfg = ITEM_TYPE_CONFIG[t];
                const Icon = cfg.icon;
                return (
                  <button key={t} type="button" onClick={() => { setItemType(t); setSelectedId(""); }}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition-all ${itemType === t ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    <Icon size={16} className={cfg.color} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              {ITEM_TYPE_CONFIG[itemType].label}
            </label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} required className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500">
              <option value="">Seleccionar...</option>
              {(options as { id: string; title: string }[]).map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Posición (orden)</label>
            <input type="number" min={1} value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
          </div>
          <button type="submit" disabled={saving || !selectedId} className="w-full rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 transition">
            {saving ? "Agregando..." : "Agregar ítem"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EnrollModal({ lineId, onClose }: { lineId: string; onClose: () => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/admin/users").then((r) => r.json()).then((d) => {
      setUsers((d.users || []).filter((u: AdminUser & { role: string }) => u.role === "user" || !u.role));
      setLoading(false);
    });
  }, []);

  const toggle = (id: string) => setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleEnroll = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    await fetch(`/api/training/lines/${lineId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: Array.from(selected) }),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Inscribir usuarios</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="max-h-72 overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
          ) : users.map((u) => (
            <button key={u.id} type="button" onClick={() => toggle(u.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${selected.has(u.id) ? "bg-green-50 border border-green-200" : "hover:bg-gray-50"}`}>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${selected.has(u.id) ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                {selected.has(u.id) && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{u.name}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100 px-5 py-4">
          <button type="button" onClick={handleEnroll} disabled={saving || selected.size === 0}
            className="w-full rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 transition">
            {saving ? "Inscribiendo..." : `Inscribir ${selected.size > 0 ? `(${selected.size})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function TrainingLineRow({ line, onDelete }: { line: TrainingLine; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<TrainingLineItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [toDelete, setToDelete] = useState(false);

  const loadDetails = async () => {
    setLoadingItems(true);
    const [ir, er] = await Promise.all([
      fetch(`/api/training/lines/${line.id}/items`),
      fetch(`/api/training/lines/${line.id}/enroll`),
    ]);
    const [id_, ed] = await Promise.all([ir.json(), er.json()]);
    setItems(id_.items || []);
    setEnrollments(ed.enrollments || []);
    setLoadingItems(false);
  };

  const toggleExpand = () => {
    if (!expanded && items.length === 0) loadDetails();
    setExpanded((v) => !v);
  };

  const handleDeleteItem = async (itemId: string) => {
    await fetch(`/api/training/lines/${line.id}/items/${itemId}`, { method: "DELETE" });
    loadDetails();
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <GraduationCap size={16} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-800 truncate">{line.title}</p>
                {line.mandatory && (
                  <span className="rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Obligatoria</span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {line.total_items} ítem{line.total_items !== 1 ? "s" : ""}
                {line.sectors ? ` · ${line.sectors}` : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => setShowEnroll(true)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-green-300 hover:text-green-600 transition">
              <Users size={12} />
              Inscribir
            </button>
            <button type="button" onClick={toggleExpand} className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-gray-300 transition">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button type="button" onClick={() => setToDelete(true)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            {loadingItems ? (
              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
            ) : (
              <>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ítems ({items.length})</p>
                    <button type="button" onClick={() => setShowAddItem(true)} className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 transition">
                      <Plus size={12} /> Agregar ítem
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">Sin ítems. Agrega cursos, evaluaciones o tareas.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const cfg = ITEM_TYPE_CONFIG[item.item_type];
                        const Icon = cfg.icon;
                        return (
                          <div key={item.id} className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">
                              {item.order_index}
                            </span>
                            <Icon size={13} className={cfg.color} />
                            <span className="flex-1 text-xs text-gray-700 truncate">{item.item_title || cfg.label}</span>
                            <span className="text-[10px] font-medium text-gray-400">{cfg.label}</span>
                            <button type="button" onClick={() => handleDeleteItem(item.id)} className="text-gray-300 hover:text-red-400 transition">
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {enrollments.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Inscritos ({enrollments.length})</p>
                    <div className="space-y-1.5">
                      {enrollments.map((e) => {
                        const pct = e.total_items > 0 ? Math.round((e.completed_items / e.total_items) * 100) : 0;
                        return (
                          <div key={e.user_id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
                            <span className="flex-1 text-xs font-medium text-gray-700 truncate">{e.user_name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 overflow-hidden rounded-full bg-gray-200">
                                <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[11px] font-semibold text-gray-500">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showAddItem && (
        <AddItemModal lineId={line.id} onClose={() => setShowAddItem(false)} onAdded={loadDetails} />
      )}
      {showEnroll && <EnrollModal lineId={line.id} onClose={() => setShowEnroll(false)} />}
      {toDelete && (
        <ConfirmDelete label={line.title} onConfirm={onDelete} onCancel={() => setToDelete(false)} />
      )}
    </>
  );
}

function LinesTab() {
  const [lines, setLines] = useState<TrainingLine[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", mandatory: false, sectorIds: [] as number[] });
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const [lr, sr] = await Promise.all([fetch("/api/training/lines"), fetch("/api/training/sectors")]);
    const [ld, sd] = await Promise.all([lr.json(), sr.json()]);
    setLines(ld.lines || []);
    setSectors(sd.sectors || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/training/lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", description: "", mandatory: false, sectorIds: [] });
    setShowForm(false);
    setSaving(false);
    fetch_();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/training/lines/${id}`, { method: "DELETE" });
    fetch_();
  };

  const toggleSector = (id: number) => {
    setForm((f) => ({
      ...f,
      sectorIds: f.sectorIds.includes(id) ? f.sectorIds.filter((s) => s !== id) : [...f.sectorIds, id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancelar" : "Nueva línea"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-green-200 bg-green-50/40 p-4 space-y-3">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Título de la línea *" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descripción" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="mandatory" checked={form.mandatory} onChange={(e) => setForm((f) => ({ ...f, mandatory: e.target.checked }))} className="accent-green-500" />
            <label htmlFor="mandatory" className="text-sm text-gray-700">Obligatoria</label>
          </div>
          {sectors.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">Sectores</p>
              <div className="flex flex-wrap gap-2">
                {sectors.map((s) => (
                  <button key={s.id} type="button" onClick={() => toggleSector(s.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${form.sectorIds.includes(s.id) ? "border-green-300 bg-green-100 text-green-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 transition">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Crear línea
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
      ) : lines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <GraduationCap size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">Sin líneas de formación. Creá la primera.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lines.map((line) => (
            <TrainingLineRow key={line.id} line={line} onDelete={() => handleDelete(line.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { id: AdminTab; label: string; icon: typeof GraduationCap }[] = [
  { id: "lines",     label: "Líneas",     icon: Layers },
  { id: "courses",   label: "Cursos",     icon: BookOpen },
  { id: "providers", label: "Proveedores", icon: Building2 },
  { id: "sectors",   label: "Sectores",   icon: Award },
];

export default function AdminTrainingManager() {
  const [tab, setTab] = useState<AdminTab>("lines");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-gray-900">Gestión de Formación</h2>
        <p className="text-sm text-gray-500">Crea líneas de formación, cursos y gestiona proveedores y sectores</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              tab === id
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div>
        {tab === "lines"     && <LinesTab />}
        {tab === "courses"   && <CoursesTab />}
        {tab === "providers" && <ProvidersTab />}
        {tab === "sectors"   && <SectorsTab />}
      </div>
    </div>
  );
}
