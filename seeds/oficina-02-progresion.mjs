#!/usr/bin/env node
/**
 * SEED 2/2 — Oficina Administrativa "Municipalidad de San Miguel" — 3 MESES
 *
 * REQUIERE haber ejecutado oficina-01-base.mjs primero.
 * NO borra datos — agrega Feb→May 2026.
 *
 * Trayectorias (score productividad inicial → final):
 *   Mejora 90%  → 52 → ~98  (adoptan digitalización, completan toda la formación)
 *   Mejora 70%  → 52 → ~88  (adoptan mayoría, trámites más rápidos)
 *   Mejora 50%  → 52 → ~78  (adopción parcial)
 *   Mejora 30%  → 52 → ~68  (resistencia al cambio, adopción lenta)
 *   Sin Mejora  → 55 → ~55  (siguen con métodos anteriores)
 *   Regresión   → 68 → ~54  (sobrecarga, errores en nuevos sistemas)
 *
 * Desde login-user/:
 *   node seeds/oficina-02-progresion.mjs
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
if (!process.env.DATABASE_URL) { console.error('❌  DATABASE_URL no configurado. Ejecutá oficina-01-base.mjs primero.'); process.exit(1); }

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
    'fernanda.m90@municipalidad.gob.ar': { base:52, mejora:90,  taskRate:0.90, evalScore:[87,95] },
    'gustavo.m90@municipalidad.gob.ar':  { base:52, mejora:90,  taskRate:0.88, evalScore:[86,94] },
    'mariela.m70@municipalidad.gob.ar':  { base:52, mejora:70,  taskRate:0.72, evalScore:[75,84] },
    'jorge.m70@municipalidad.gob.ar':    { base:52, mejora:70,  taskRate:0.70, evalScore:[74,83] },
    'claudia.m50@municipalidad.gob.ar':  { base:52, mejora:50,  taskRate:0.52, evalScore:[66,76] },
    'ricardo.m30@municipalidad.gob.ar':  { base:52, mejora:30,  taskRate:0.35, evalScore:[62,72] },
    'silvia.sm@municipalidad.gob.ar':    { base:55, mejora:0,   taskRate:0.28, evalScore:[57,65] },
    'omar.rg@municipalidad.gob.ar':      { base:68, mejora:-20, taskRate:0.18, evalScore:[55,63] },
  };

  const allU  = Object.keys(PERFILES).map(e => U[e]).filter(Boolean);
  const days  = weekdays('2026-02-02', '2026-05-02');
  const total = days.length;

  // ── Completar relevamiento inicial ────────────────────────────────────────
  console.log('✅  Completando tarea inicial...');
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid || perfil.mejora <= 0) continue;
    await sql`UPDATE tasks SET status='completed', progress=100, completed_date='2026-02-12'
      WHERE user_id=${uid} AND title='Relevamiento de Trámites del Área' AND status='pending'`;
  }

  // Clima institucional — completar
  console.log('📊  Completando evaluación de clima...');
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    const score = rand(perfil.evalScore[0] - 8, perfil.evalScore[0]);
    await sql`UPDATE evaluations SET status='completed', score=${score}, completed_date='2026-02-25'
      WHERE user_id=${uid} AND template_id=${ET['Evaluación de Clima Institucional Q1']} AND status='pending'`;
  }

  // ── Tareas del período ─────────────────────────────────────────────────────
  console.log('📝  Tareas Feb–May...');
  const tareasBase = [
    ['Actualizar Archivo Documental','Digitalizar Expedientes — Feb 2026',     '2026-02-16','2026-02-28',null],
    ['Informe Mensual de Gestión',   'Informe de Gestión — Febrero 2026',       '2026-02-24','2026-02-28',null],
    ['Elaborar Circular Interna',    'Circular — Nuevos Sistemas de Trámites',  '2026-03-02','2026-03-10',null],
    ['Actualizar Archivo Documental','Digitalizar Expedientes — Mar 2026',      '2026-03-09','2026-03-21',null],
    ['Informe Mensual de Gestión',   'Informe de Gestión — Marzo 2026',         '2026-03-24','2026-03-31',null],
    ['Capacitar Nuevos Agentes',     'Inducción — Nuevos Agentes Marzo',        '2026-03-10','2026-03-21',null],
    ['Elaborar Circular Interna',    'Circular — Actualización Normativa 2026', '2026-04-01','2026-04-10',null],
    ['Actualizar Archivo Documental','Digitalizar Expedientes — Abr 2026',      '2026-04-07','2026-04-18',null],
    ['Informe Mensual de Gestión',   'Informe de Gestión — Abril 2026',         '2026-04-24','2026-04-30',null],
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
        VALUES (${uuid()},${tplId},${uid},${A},${title},'',${status},${progress},${assigned},${due},${done},${assigned+'T08:00:00Z'})`;
    }
  }

  // ── Evaluaciones del período ───────────────────────────────────────────────
  console.log('📊  Evaluaciones...');

  // Atención al ciudadano — según perfil
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    const status = perfil.mejora >= 70 ? 'completed' : (perfil.mejora >= 30 ? 'in_progress' : 'pending');
    const score  = status === 'completed' ? rand(perfil.evalScore[0], perfil.evalScore[1]) : null;
    const done   = status === 'completed' ? '2026-03-25' : null;
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,completed_date,score,max_score,created_at)
      VALUES (${uuid()},${ET['Evaluación de Atención al Ciudadano']},${uid},${A},
        ${status},'2026-02-15','2026-03-31',${done},${score},100,'2026-02-15T10:00:00Z')`;
  }

  // Competencias digitales — solo los que adoptan digitalización
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid || perfil.mejora < 30) continue;
    const status = perfil.mejora >= 70 ? 'completed' : (perfil.mejora >= 50 ? 'in_progress' : 'pending');
    const score  = status === 'completed' ? rand(perfil.evalScore[0], perfil.evalScore[1]) : null;
    const done   = status === 'completed' ? '2026-04-10' : null;
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,completed_date,score,max_score,created_at)
      VALUES (${uuid()},${ET['Evaluación de Competencias Digitales']},${uid},${A},
        ${status},'2026-03-01','2026-04-15',${done},${score},100,'2026-03-01T10:00:00Z')`;
  }

  // Desempeño anual — todos, mix de estados
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    const status = perfil.mejora >= 70 ? 'completed' : (perfil.mejora >= 30 ? 'in_progress' : 'pending');
    const score  = status === 'completed' ? rand(perfil.evalScore[0]+3, perfil.evalScore[1]) : null;
    const done   = status === 'completed' ? '2026-04-28' : null;
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,completed_date,score,max_score,created_at)
      VALUES (${uuid()},${ET['Evaluación de Desempeño Anual 2026']},${uid},${A},
        ${status},'2026-04-01','2026-05-31',${done},${score},100,'2026-04-01T10:00:00Z')`;
  }

  // ── Course Enrollments ─────────────────────────────────────────────────────
  console.log('🎒  Cursos...');
  const enrollments = {
    'fernanda.m90@municipalidad.gob.ar': [
      { c:'Atención al Ciudadano con Calidad', tl:'Inducción Institucional', done:'2026-02-20' },
      { c:'Normativa y Procedimientos 2026',    tl:'Inducción Institucional', done:'2026-03-05' },
      { c:'Gestión Documental Digital',         tl:'Inducción Institucional', done:'2026-03-20' },
      { c:'Sistemas de Gestión Municipal',      tl:'Digitalización de Procesos', done:'2026-04-10' },
      { c:'Gestión de Trámites Online',         tl:'Digitalización de Procesos', done:'2026-04-28' },
    ],
    'gustavo.m90@municipalidad.gob.ar': [
      { c:'Atención al Ciudadano con Calidad', tl:'Inducción Institucional', done:'2026-02-22' },
      { c:'Normativa y Procedimientos 2026',    tl:'Inducción Institucional', done:'2026-03-08' },
      { c:'Gestión Documental Digital',         tl:'Inducción Institucional', done:'2026-03-22' },
      { c:'Excel para Administración Pública',  tl:'Actualización Normativa y Contable', done:'2026-04-12' },
      { c:'Redacción Administrativa Profesional',tl:'Actualización Normativa y Contable', done:'2026-04-25' },
    ],
    'mariela.m70@municipalidad.gob.ar': [
      { c:'Atención al Ciudadano con Calidad', tl:'Inducción Institucional', done:'2026-03-01' },
      { c:'Normativa y Procedimientos 2026',    tl:'Inducción Institucional', done:'2026-03-18' },
      { c:'Gestión Documental Digital',         tl:'Inducción Institucional', done:'2026-04-05' },
    ],
    'jorge.m70@municipalidad.gob.ar': [
      { c:'Atención al Ciudadano con Calidad', tl:'Inducción Institucional', done:'2026-03-05' },
      { c:'Normativa y Procedimientos 2026',    tl:'Inducción Institucional', done:'2026-03-22' },
      { c:'Excel para Administración Pública',  tl:'Actualización Normativa y Contable', done:'2026-04-18' },
    ],
    'claudia.m50@municipalidad.gob.ar': [
      { c:'Atención al Ciudadano con Calidad', tl:'Inducción Institucional', done:'2026-03-15' },
      { c:'Sistemas de Gestión Municipal',      tl:'Digitalización de Procesos', done:null },
    ],
    'ricardo.m30@municipalidad.gob.ar': [
      { c:'Atención al Ciudadano con Calidad', tl:'Inducción Institucional', done:null },
    ],
    'silvia.sm@municipalidad.gob.ar':   [],
    'omar.rg@municipalidad.gob.ar':     [],
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
  console.log('📈  Progreso...');
  const progressData = {
    'fernanda.m90@municipalidad.gob.ar': [['Inducción Institucional',3,3],['Digitalización de Procesos',3,2]],
    'gustavo.m90@municipalidad.gob.ar':  [['Inducción Institucional',3,3],['Actualización Normativa y Contable',3,2]],
    'mariela.m70@municipalidad.gob.ar':  [['Inducción Institucional',3,3]],
    'jorge.m70@municipalidad.gob.ar':    [['Inducción Institucional',3,3],['Actualización Normativa y Contable',3,1]],
    'claudia.m50@municipalidad.gob.ar':  [['Inducción Institucional',3,2],['Digitalización de Procesos',3,1]],
    'ricardo.m30@municipalidad.gob.ar':  [['Inducción Institucional',3,1],['Digitalización de Procesos',3,0]],
    'silvia.sm@municipalidad.gob.ar':    [['Inducción Institucional',3,0]],
    'omar.rg@municipalidad.gob.ar':      [['Inducción Institucional',3,0]],
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
  console.log('📊  Métricas...');
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    for (let d = 0; d < days.length; d++) {
      const score     = trayectoria(d, total, perfil.base, perfil.mejora);
      const assigned  = rand(1, 3);
      const completed = Math.random() < perfil.taskRate ? rand(1, assigned) : 0;
      await sql`INSERT INTO productivity_metrics (id,user_id,date,tasks_completed,tasks_assigned,total_work_time,productivity_score,created_at)
        VALUES (${uuid()},${uid},${days[d]},${completed},${assigned},${rand(420,490)},${score},${days[d]+'T17:30:00Z'})
        ON CONFLICT (user_id,date) DO NOTHING`;
    }
  }

  // ── Work Sessions ──────────────────────────────────────────────────────────
  console.log('⏱  Sesiones...');
  for (const uid of allU) {
    for (const day of days) {
      if (Math.random() < 0.05) continue;
      await sql`INSERT INTO work_sessions (user_id,session_date,duration)
        VALUES (${uid},${day},${rand(420,490)}) ON CONFLICT (user_id,session_date) DO NOTHING`;
    }
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  console.log('🏅  Certificaciones...');
  await sql`INSERT INTO certifications (id,user_id,course_id,title,issuer,issued_date,credential_url,verified) VALUES
    (${uuid()},${U['fernanda.m90@municipalidad.gob.ar']},${C['Atención al Ciudadano con Calidad']},
      'Atención al Ciudadano con Calidad','Municipalidad de San Miguel','2026-02-20',null,true),
    (${uuid()},${U['fernanda.m90@municipalidad.gob.ar']},${C['Gestión Documental Digital']},
      'Gestión Documental Digital — INAP','INAP','2026-03-20','https://inap.gob.ar/cert/fernanda-gd',true),
    (${uuid()},${U['gustavo.m90@municipalidad.gob.ar']}, ${C['Normativa y Procedimientos 2026']},
      'Normativa y Procedimientos 2026 — INAP','INAP','2026-03-08','https://inap.gob.ar/cert/gustavo-norm',true),
    (${uuid()},${U['gustavo.m90@municipalidad.gob.ar']}, ${C['Excel para Administración Pública']},
      'Excel para Administración Pública — Udemy','Udemy Business','2026-04-12','https://udemy.com/cert/excel-gustavo',false),
    (${uuid()},${U['mariela.m70@municipalidad.gob.ar']}, ${C['Atención al Ciudadano con Calidad']},
      'Atención al Ciudadano con Calidad','Municipalidad de San Miguel','2026-03-01',null,true),
    (${uuid()},${U['jorge.m70@municipalidad.gob.ar']},   ${C['Normativa y Procedimientos 2026']},
      'Normativa y Procedimientos 2026 — INAP','INAP','2026-03-22','https://inap.gob.ar/cert/jorge-norm',true)
  `;

  // ── ROI Snapshots ──────────────────────────────────────────────────────────
  console.log('💰  ROI snapshots...');
  const roiData = [
    { e:'fernanda.m90@municipalidad.gob.ar', tl:'Inducción Institucional',        snap:'2026-02-01',cost:0, prod:52,eval:0, tasks:0 },
    { e:'gustavo.m90@municipalidad.gob.ar',  tl:'Inducción Institucional',        snap:'2026-02-01',cost:0, prod:52,eval:0, tasks:0 },
    { e:'mariela.m70@municipalidad.gob.ar',  tl:'Inducción Institucional',        snap:'2026-02-01',cost:0, prod:52,eval:0, tasks:0 },
    { e:'jorge.m70@municipalidad.gob.ar',    tl:'Inducción Institucional',        snap:'2026-02-01',cost:0, prod:52,eval:0, tasks:0 },
    { e:'claudia.m50@municipalidad.gob.ar',  tl:'Inducción Institucional',        snap:'2026-02-01',cost:0, prod:52,eval:0, tasks:0 },
    { e:'ricardo.m30@municipalidad.gob.ar',  tl:'Inducción Institucional',        snap:'2026-02-01',cost:0, prod:52,eval:0, tasks:0 },
    { e:'fernanda.m90@municipalidad.gob.ar', tl:'Digitalización de Procesos',     snap:'2026-02-05',cost:0, prod:54,eval:0, tasks:45 },
    { e:'gustavo.m90@municipalidad.gob.ar',  tl:'Actualización Normativa y Contable',snap:'2026-02-05',cost:8,prod:53,eval:0,tasks:48 },
    { e:'jorge.m70@municipalidad.gob.ar',    tl:'Actualización Normativa y Contable',snap:'2026-02-05',cost:8,prod:52,eval:0,tasks:42 },
  ];
  for (const r of roiData) {
    const uid = U[r.e]; const tlId = TL[r.tl];
    if (!uid || !tlId) continue;
    await sql`INSERT INTO training_roi_snapshots (user_id,training_line_id,snapshot_date,avg_productivity,avg_eval_score,tasks_completion_pct,training_cost)
      VALUES (${uid},${tlId},${r.snap},${r.prod},${r.eval},${r.tasks},${r.cost}) ON CONFLICT (user_id,training_line_id) DO NOTHING`;
  }

  const c = (await sql`SELECT
    (SELECT COUNT(*) FROM tasks WHERE status='completed') AS tasks_completadas,
    (SELECT COUNT(*) FROM evaluations WHERE status='completed') AS evals_completadas,
    (SELECT COUNT(*) FROM productivity_metrics) AS metricas,
    (SELECT COUNT(*) FROM work_sessions) AS sesiones,
    (SELECT COUNT(*) FROM course_enrollments WHERE status='completed') AS cursos_completados,
    (SELECT COUNT(*) FROM certifications) AS certificaciones
  `)[0];

  console.log('\n✅  oficina-02-progresion completado\n');
  console.log('📊  Registros nuevos:');
  Object.entries(c).forEach(([k,v]) => console.log(`   ${k.padEnd(25)} ${v}`));
  console.log('\n📈  Trayectorias esperadas:');
  console.log('   fernanda.m90 / gustavo.m90   →  52 → ~98  (Mejora 90% — adopción total)');
  console.log('   mariela.m70 / jorge.m70       →  52 → ~88  (Mejora 70%)');
  console.log('   claudia.m50                   →  52 → ~78  (Mejora 50%)');
  console.log('   ricardo.m30                   →  52 → ~68  (Mejora 30%)');
  console.log('   silvia.sm                     →  55 → ~55  (Sin Mejora — métodos anteriores)');
  console.log('   omar.rg                       →  68 → ~54  (Regresión — sobrecarga)');
  console.log('\n💡  El dashboard muestra claramente: quienes adoptaron la digitalización');
  console.log('    mejoraron su productividad. Quienes no, quedaron estancados o empeoraron.');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
