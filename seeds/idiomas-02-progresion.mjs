#!/usr/bin/env node
/**
 * SEED 2/2 — Instituto de Idiomas "LinguaForward" — 3 MESES DE ACTIVIDAD
 *
 * REQUIERE haber ejecutado idiomas-01-base.mjs primero.
 * NO borra datos — agrega Feb→May 2026.
 *
 * Trayectorias:
 *   Mejora 90%  → 52 → ~98  (asistencia perfecta, completan todo el programa)
 *   Mejora 70%  → 52 → ~88  (asistencia regular, completan mayoría)
 *   Mejora 50%  → 52 → ~78  (asistencia irregular, práctica parcial)
 *   Mejora 30%  → 52 → ~68  (asistencia mínima)
 *   Sin Mejora  → 55 → ~55  (inasistencias recurrentes)
 *   Regresión   → 68 → ~54  (abandono parcial del programa)
 *
 * Desde login-user/:
 *   node seeds/idiomas-02-progresion.mjs
 */
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

for (const p of ['.env.local', 'apps/web/.env.local']) {
  try {
    const raw = readFileSync(resolve(process.cwd(), p), 'utf-8');
    for (const line of raw.split('\n')) {
      const eq = line.indexOf('=');
      if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
    break;
  } catch {}
}
if (!process.env.DATABASE_URL) { console.error('❌  DATABASE_URL no configurado. Ejecutá idiomas-01-base.mjs primero.'); process.exit(1); }

const sql  = neon(process.env.DATABASE_URL);
const uuid = () => crypto.randomUUID();
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

function weekdays(from, to) {
  const days = [], cur = new Date(from + 'T12:00:00Z'), end = new Date(to + 'T12:00:00Z');
  while (cur <= end) {
    if (cur.getUTCDay() >= 1 && cur.getUTCDay() <= 5) days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}
function trayectoria(day, total, baseline, improvementPct) {
  const target  = baseline * (1 + improvementPct / 100);
  const current = baseline + (target - baseline) * (day / total);
  return Math.min(98, Math.max(20, Math.round(current + rand(-5, 5))));
}

async function main() {
  console.log('🔍  Leyendo IDs de la DB...');
  const users   = await sql`SELECT id, email FROM users WHERE role='user'`;
  const admins  = await sql`SELECT id, email FROM users WHERE role='admin'`;
  const courses = await sql`SELECT id, title FROM courses`;
  const tlines  = await sql`SELECT id, title FROM training_lines`;
  const ttmpls  = await sql`SELECT id, title FROM task_templates`;
  const etmpls  = await sql`SELECT id, title FROM evaluation_templates`;

  const U  = Object.fromEntries(users.map(r  => [r.email, r.id]));
  const A  = admins[0].id;
  const C  = Object.fromEntries(courses.map(r => [r.title, r.id]));
  const TL = Object.fromEntries(tlines.map(r  => [r.title, r.id]));
  const TT = Object.fromEntries(ttmpls.map(r  => [r.title, r.id]));
  const ET = Object.fromEntries(etmpls.map(r  => [r.title, r.id]));

  const PERFILES = {
    'pablo.m90@linguaforward.com':   { base:52, mejora:90,  taskRate:0.90, evalScore:[88,96] },
    'carla.m90@linguaforward.com':   { base:52, mejora:90,  taskRate:0.88, evalScore:[87,95] },
    'javier.m70@linguaforward.com':  { base:52, mejora:70,  taskRate:0.72, evalScore:[76,85] },
    'sofia.m70@linguaforward.com':   { base:52, mejora:70,  taskRate:0.70, evalScore:[74,83] },
    'diego.m50@linguaforward.com':   { base:52, mejora:50,  taskRate:0.52, evalScore:[66,77] },
    'ana.m30@linguaforward.com':     { base:52, mejora:30,  taskRate:0.35, evalScore:[62,72] },
    'nicolas.sm@linguaforward.com':  { base:55, mejora:0,   taskRate:0.28, evalScore:[57,65] },
    'laura.rg@linguaforward.com':    { base:68, mejora:-20, taskRate:0.18, evalScore:[55,63] },
  };

  const allU  = Object.keys(PERFILES).map(e => U[e]).filter(Boolean);
  const days  = weekdays('2026-02-02', '2026-05-02');
  const total = days.length;

  // ── Completar tarea inicial según perfil ──────────────────────────────────
  console.log('✅  Completando tarea inicial...');
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid || perfil.mejora <= 0) continue;
    await sql`UPDATE tasks SET status='completed', progress=100, completed_date='2026-02-07'
      WHERE user_id=${uid} AND title='Primera Práctica de Conversación' AND status='pending'`;
  }

  // Evaluación diagnóstica — completar para todos con diferentes scores
  console.log('📊  Completando evaluación diagnóstica...');
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    const score = rand(perfil.evalScore[0] - 10, perfil.evalScore[0]);
    await sql`UPDATE evaluations SET status='completed', score=${score}, completed_date='2026-02-06'
      WHERE user_id=${uid} AND template_id=${ET['Evaluación Diagnóstica de Nivel']} AND status='pending'`;
  }

  // ── Tareas del período ─────────────────────────────────────────────────────
  console.log('📝  Tareas del período Feb–May...');
  const tareasBase = [
    ['Práctica de Conversación','Conversación — Vocabulario Básico Feb',    '2026-02-08','2026-02-14',null],
    ['Ejercicio de Writing',    'Writing — Descripción Personal',            '2026-02-10','2026-02-21',null],
    ['Listening Comprehension', 'Listening — Diálogos Cotidianos',           '2026-02-16','2026-02-28',null],
    ['Diario de Aprendizaje Mensual','Diario de Aprendizaje — Febrero',      '2026-02-24','2026-02-28',null],
    ['Práctica de Conversación','Conversación — Presente y Pasado',          '2026-03-02','2026-03-08',null],
    ['Ejercicio de Writing',    'Writing — Email Formal',                    '2026-03-09','2026-03-21',null],
    ['Listening Comprehension', 'Listening — Inglés de Negocios',            '2026-03-16','2026-03-28',null],
    ['Diario de Aprendizaje Mensual','Diario de Aprendizaje — Marzo',        '2026-03-24','2026-03-31',null],
    ['Presentación Oral',       'Presentación Oral — Mi Empresa',            '2026-04-01','2026-04-15',null],
    ['Práctica de Conversación','Conversación — Rol Play Entrevista',        '2026-04-07','2026-04-14',null],
    ['Ejercicio de Writing',    'Writing — Informe de Progreso',             '2026-04-14','2026-04-25',null],
    ['Diario de Aprendizaje Mensual','Diario de Aprendizaje — Abril',        '2026-04-24','2026-04-30',null],
  ];

  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    for (const [tplTitle, title, assigned, due] of tareasBase) {
      const tplId = TT[tplTitle];
      const r = Math.random();
      let status, progress, done;
      const isPast = new Date(due) < new Date('2026-05-01');

      if (r < perfil.taskRate) {
        status = 'completed'; progress = 100;
        const d = new Date(due); d.setDate(d.getDate() - rand(0, 3));
        done = d.toISOString().slice(0, 10);
      } else if (isPast) {
        status = 'pending'; progress = 0; done = null;
      } else {
        status = r < perfil.taskRate + 0.2 ? 'in-progress' : 'pending';
        progress = status === 'in-progress' ? rand(20, 65) : 0; done = null;
      }
      await sql`INSERT INTO tasks (id,template_id,user_id,assigned_by,title,description,status,progress,assigned_date,due_date,completed_date,created_at)
        VALUES (${uuid()},${tplId},${uid},${A},${title},'',${status},${progress},${assigned},${due},${done},${assigned+'T09:00:00Z'})`;
    }
  }

  // ── Evaluaciones con resultados ────────────────────────────────────────────
  console.log('📊  Evaluaciones del período...');

  // Nivel A2 — según perfil
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    const status = perfil.mejora >= 70 ? 'completed' : (perfil.mejora >= 30 ? 'in_progress' : 'pending');
    const score  = status === 'completed' ? rand(perfil.evalScore[0], perfil.evalScore[1]) : null;
    const done   = status === 'completed' ? '2026-03-28' : null;
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,completed_date,score,max_score,created_at)
      VALUES (${uuid()},${ET['Examen de Progreso — Nivel A2']},${uid},${A},
        ${status},'2026-02-15','2026-03-31',${done},${score},100,'2026-02-15T10:00:00Z')`;
  }

  // Oral B1 — solo mejora ≥ 50%
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid || perfil.mejora < 50) continue;
    const status = perfil.mejora >= 70 ? 'completed' : 'in_progress';
    const score  = status === 'completed' ? rand(perfil.evalScore[0]+3, perfil.evalScore[1]) : null;
    const done   = status === 'completed' ? '2026-04-22' : null;
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,completed_date,score,max_score,created_at)
      VALUES (${uuid()},${ET['Evaluación de Expresión Oral B1']},${uid},${A},
        ${status},'2026-03-15','2026-04-30',${done},${score},100,'2026-03-15T10:00:00Z')`;
  }

  // Final Alemán A1 — usuarios de alemán (carla m90, sofia m70)
  for (const [email, perfil] of Object.entries({
    'carla.m90@linguaforward.com': PERFILES['carla.m90@linguaforward.com'],
    'sofia.m70@linguaforward.com': PERFILES['sofia.m70@linguaforward.com'],
  })) {
    const uid = U[email];
    if (!uid) continue;
    const status = perfil.mejora >= 70 ? 'completed' : 'in_progress';
    const score  = status === 'completed' ? rand(perfil.evalScore[0], perfil.evalScore[1]) : null;
    const done   = status === 'completed' ? '2026-04-25' : null;
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,completed_date,score,max_score,created_at)
      VALUES (${uuid()},${ET['Examen Final Módulo Alemán A1']},${uid},${A},
        ${status},'2026-03-15','2026-04-30',${done},${score},100,'2026-03-15T10:00:00Z')`;
  }

  // ── Course Enrollments ─────────────────────────────────────────────────────
  console.log('🎒  Inscripciones a cursos...');
  const enrollments = {
    'pablo.m90@linguaforward.com': [
      { c:'Inglés A1 — Fundamentos',    tl:'English Fast Track A1→B1', done:'2026-02-28' },
      { c:'Inglés A2 — Comunicación Básica', tl:'English Fast Track A1→B1', done:'2026-04-01' },
    ],
    'carla.m90@linguaforward.com': [
      { c:'Alemán A1 — Grundkurs',      tl:'German Starter A1→A2', done:'2026-03-15' },
      { c:'Pronunciación y Fonética',   tl:'German Starter A1→A2', done:'2026-04-05' },
    ],
    'javier.m70@linguaforward.com': [
      { c:'Inglés A1 — Fundamentos',    tl:'English Fast Track A1→B1', done:'2026-03-10' },
      { c:'Inglés A2 — Comunicación Básica', tl:'English Fast Track A1→B1', done:null },
    ],
    'sofia.m70@linguaforward.com': [
      { c:'Alemán A1 — Grundkurs',      tl:'German Starter A1→A2', done:'2026-03-25' },
    ],
    'diego.m50@linguaforward.com': [
      { c:'Inglés A1 — Fundamentos',    tl:'English Fast Track A1→B1', done:'2026-03-20' },
    ],
    'ana.m30@linguaforward.com': [
      { c:'Inglés A1 — Fundamentos',    tl:'English Fast Track A1→B1', done:null },
    ],
    'nicolas.sm@linguaforward.com':  [],
    'laura.rg@linguaforward.com':    [],
  };
  for (const [email, cursos] of Object.entries(enrollments)) {
    const uid = U[email];
    if (!uid) continue;
    for (const { c, tl, done } of cursos) {
      await sql`INSERT INTO course_enrollments (user_id,course_id,training_line_id,status,completed_at)
        VALUES (${uid},${C[c]},${TL[tl]},${done ? 'completed' : 'in_progress'},${done ? done+'T00:00:00Z' : null})
        ON CONFLICT (user_id,course_id,training_line_id) DO NOTHING`;
    }
  }

  // ── Training Line Progress ─────────────────────────────────────────────────
  console.log('📈  Actualizando progreso...');
  const progressData = {
    'pablo.m90@linguaforward.com':  [['English Fast Track A1→B1',5,2]],
    'carla.m90@linguaforward.com':  [['German Starter A1→A2',2,2]],
    'javier.m70@linguaforward.com': [['English Fast Track A1→B1',5,2]],
    'sofia.m70@linguaforward.com':  [['German Starter A1→A2',2,1]],
    'diego.m50@linguaforward.com':  [['English Fast Track A1→B1',5,1]],
    'ana.m30@linguaforward.com':    [['English Fast Track A1→B1',5,0]],
    'nicolas.sm@linguaforward.com': [['English Fast Track A1→B1',5,0]],
    'laura.rg@linguaforward.com':   [['English Fast Track A1→B1',5,0]],
  };
  for (const [email, lines] of Object.entries(progressData)) {
    const uid = U[email];
    if (!uid) continue;
    for (const [lineName, t, comp] of lines) {
      await sql`INSERT INTO training_line_progress (user_id,training_line_id,total_items,completed_items,last_updated)
        VALUES (${uid},${TL[lineName]},${t},${comp},NOW())
        ON CONFLICT (user_id,training_line_id) DO UPDATE SET completed_items=EXCLUDED.completed_items,last_updated=NOW()`;
    }
  }

  // ── Productivity Metrics ───────────────────────────────────────────────────
  console.log('📊  Generando métricas...');
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    for (let d = 0; d < days.length; d++) {
      const score     = trayectoria(d, total, perfil.base, perfil.mejora);
      const assigned  = rand(1, 2);
      const completed = Math.random() < perfil.taskRate ? rand(1, assigned) : 0;
      await sql`INSERT INTO productivity_metrics (id,user_id,date,tasks_completed,tasks_assigned,total_work_time,productivity_score,created_at)
        VALUES (${uuid()},${uid},${days[d]},${completed},${assigned},${rand(60,120)},${score},${days[d]+'T18:00:00Z'})
        ON CONFLICT (user_id,date) DO NOTHING`;
    }
  }

  // ── Work Sessions ──────────────────────────────────────────────────────────
  console.log('⏱  Sesiones...');
  for (const uid of allU) {
    for (const day of days) {
      if (Math.random() < 0.10) continue;
      await sql`INSERT INTO work_sessions (user_id,session_date,duration)
        VALUES (${uid},${day},${rand(60,150)}) ON CONFLICT (user_id,session_date) DO NOTHING`;
    }
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  console.log('🏅  Certificaciones...');
  await sql`INSERT INTO certifications (id,user_id,course_id,title,issuer,issued_date,credential_url,verified) VALUES
    (${uuid()},${U['pablo.m90@linguaforward.com']}, ${C['Inglés A1 — Fundamentos']},         'Inglés A1 Fundamentos — Completado','LinguaForward','2026-02-28',null,true),
    (${uuid()},${U['pablo.m90@linguaforward.com']}, ${C['Inglés A2 — Comunicación Básica']}, 'Inglés A2 Comunicación Básica — Berlitz','Berlitz Argentina','2026-04-01','https://berlitz.com/cert/pablo-a2',true),
    (${uuid()},${U['carla.m90@linguaforward.com']}, ${C['Alemán A1 — Grundkurs']},           'Alemán A1 Grundkurs — Completado','LinguaForward','2026-03-15',null,true),
    (${uuid()},${U['carla.m90@linguaforward.com']}, ${C['Pronunciación y Fonética']},        'Pronunciación y Fonética — Completado','LinguaForward','2026-04-05',null,true),
    (${uuid()},${U['javier.m70@linguaforward.com']},${C['Inglés A1 — Fundamentos']},         'Inglés A1 Fundamentos — Completado','LinguaForward','2026-03-10',null,true)
  `;

  // ── ROI Snapshots ──────────────────────────────────────────────────────────
  console.log('💰  ROI snapshots...');
  const roiData = [
    { e:'pablo.m90@linguaforward.com',  tl:'English Fast Track A1→B1', snap:'2026-02-01',cost:45,prod:52,eval:0, tasks:0 },
    { e:'carla.m90@linguaforward.com',  tl:'German Starter A1→A2',     snap:'2026-02-01',cost:0, prod:52,eval:0, tasks:0 },
    { e:'javier.m70@linguaforward.com', tl:'English Fast Track A1→B1', snap:'2026-02-01',cost:45,prod:52,eval:0, tasks:0 },
    { e:'sofia.m70@linguaforward.com',  tl:'German Starter A1→A2',     snap:'2026-02-01',cost:0, prod:52,eval:0, tasks:0 },
    { e:'diego.m50@linguaforward.com',  tl:'English Fast Track A1→B1', snap:'2026-02-01',cost:20,prod:52,eval:0, tasks:0 },
    { e:'ana.m30@linguaforward.com',    tl:'English Fast Track A1→B1', snap:'2026-02-01',cost:25,prod:52,eval:0, tasks:0 },
    { e:'nicolas.sm@linguaforward.com', tl:'English Fast Track A1→B1', snap:'2026-02-01',cost:20,prod:55,eval:0, tasks:0 },
    { e:'laura.rg@linguaforward.com',   tl:'English Fast Track A1→B1', snap:'2026-02-01',cost:25,prod:68,eval:0, tasks:0 },
  ];
  for (const r of roiData) {
    const uid = U[r.e]; const tlId = TL[r.tl];
    if (!uid || !tlId) continue;
    await sql`INSERT INTO training_roi_snapshots (user_id,training_line_id,snapshot_date,avg_productivity,avg_eval_score,tasks_completion_pct,training_cost)
      VALUES (${uid},${tlId},${r.snap},${r.prod},${r.eval},${r.tasks},${r.cost}) ON CONFLICT (user_id,training_line_id) DO NOTHING`;
  }

  console.log('\n✅  idiomas-02-progresion completado\n');
  console.log('📈  Trayectorias esperadas:');
  console.log('   pablo.m90 / carla.m90      →  52 → ~98  (Mejora 90%)');
  console.log('   javier.m70 / sofia.m70     →  52 → ~88  (Mejora 70%)');
  console.log('   diego.m50                  →  52 → ~78  (Mejora 50%)');
  console.log('   ana.m30                    →  52 → ~68  (Mejora 30%)');
  console.log('   nicolas.sm                 →  55 → ~55  (Sin Mejora)');
  console.log('   laura.rg                   →  68 → ~54  (Regresión -20%)');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
