#!/usr/bin/env node
/**
 * SEED 2/2 — Software Factory "TechCraft Solutions" — 3 MESES DE ACTIVIDAD
 *
 * REQUIERE haber ejecutado sf-01-base.mjs primero.
 * NO borra datos anteriores — solo agrega actividad simulada de Feb→May 2026.
 *
 * Trayectorias de productividad por perfil (score inicial → score final):
 *   Mejora 90%  → 52 → 98  (completan toda la formación)
 *   Mejora 70%  → 52 → 88  (completan la mayoría)
 *   Mejora 50%  → 52 → 78  (completan parcialmente)
 *   Mejora 30%  → 52 → 68  (avanzan poco)
 *   Sin Mejora  → 55 → 55  (plano, sin formación)
 *   Regresión   → 68 → 54  (sobrecarga, sin formación)
 *
 * Desde login-user/:
 *   node seeds/sf-02-progresion.mjs
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
if (!process.env.DATABASE_URL) { console.error('❌  DATABASE_URL no configurado. Ejecutá sf-01-base.mjs primero.'); process.exit(1); }

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

// Genera score con trayectoria lineal + ruido
function trayectoria(day, total, baseline, improvementPct) {
  const target  = baseline * (1 + improvementPct / 100);
  const current = baseline + (target - baseline) * (day / total);
  return Math.min(98, Math.max(20, Math.round(current + rand(-5, 5))));
}

async function main() {
  // ── Leer IDs existentes desde la DB ───────────────────────────────────────
  console.log('🔍  Leyendo IDs existentes de la DB...');

  const users     = await sql`SELECT id, email FROM users WHERE role='user'`;
  const admins    = await sql`SELECT id, email FROM users WHERE role='admin'`;
  const courses   = await sql`SELECT id, title FROM courses`;
  const tlines    = await sql`SELECT id, title FROM training_lines`;
  const ttmpls    = await sql`SELECT id, title FROM task_templates`;
  const etmpls    = await sql`SELECT id, title FROM evaluation_templates`;

  const U  = Object.fromEntries(users.map(r  => [r.email, r.id]));
  const A  = admins[0].id;   // admin principal
  const C  = Object.fromEntries(courses.map(r => [r.title, r.id]));
  const TL = Object.fromEntries(tlines.map(r  => [r.title, r.id]));
  const TT = Object.fromEntries(ttmpls.map(r  => [r.title, r.id]));
  const ET = Object.fromEntries(etmpls.map(r  => [r.title, r.id]));

  // Perfiles de mejora mapeados por email
  const PERFILES = {
    'sofia.m90@techcraft.com':    { base: 52, mejora: 90,  taskRate: 0.90, evalScore: [88,95] },
    'lucas.m90@techcraft.com':    { base: 52, mejora: 90,  taskRate: 0.88, evalScore: [85,94] },
    'miguel.m70@techcraft.com':   { base: 52, mejora: 70,  taskRate: 0.72, evalScore: [76,85] },
    'camila.m70@techcraft.com':   { base: 52, mejora: 70,  taskRate: 0.70, evalScore: [74,83] },
    'andres.m50@techcraft.com':   { base: 52, mejora: 50,  taskRate: 0.52, evalScore: [68,78] },
    'natalia.m30@techcraft.com':  { base: 52, mejora: 30,  taskRate: 0.35, evalScore: [63,73] },
    'roberto.sm@techcraft.com':   { base: 55, mejora:  0,  taskRate: 0.28, evalScore: [58,65] },
    'isabella.rg@techcraft.com':  { base: 68, mejora: -20, taskRate: 0.18, evalScore: [55,63] },
  };

  const allU  = Object.keys(PERFILES).map(email => U[email]).filter(Boolean);
  const days  = weekdays('2026-02-02', '2026-05-02');
  const total = days.length;

  // ── Marcar tareas iniciales como completadas (según perfil) ───────────────
  console.log('✅  Completando tareas de onboarding...');
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    if (perfil.mejora > 0) {
      // Los que mejoran completaron el onboarding
      await sql`UPDATE tasks SET status='completed', progress=100, completed_date='2026-02-10'
        WHERE user_id=${uid} AND title='Configurar Entorno de Desarrollo' AND status='pending'`;
    }
  }

  // ── Tareas distribuidas Feb–May (según perfil de mejora) ──────────────────
  console.log('📝  Insertando tareas del período...');

  // Estructura de tareas por período: [template_title, title, assigned, due, tl_title|null]
  const tareasBase = [
    // Feb — sprint reports
    ['Sprint Report Mensual','Sprint Report Febrero 2026','2026-02-24','2026-02-28',null],
    // Mar — código y docs
    ['Code Review — Pull Request','Code Review PR — Semana 9','2026-03-02','2026-03-07',null],
    ['Documentar Módulo API','Documentar API de Usuarios','2026-03-10','2026-03-24',null],
    ['Sprint Report Mensual','Sprint Report Marzo 2026','2026-03-24','2026-03-31',null],
    // Apr — features y sprint
    ['Implementar Feature Nueva','Implementar Feature de Notificaciones','2026-04-01','2026-04-22',null],
    ['Code Review — Pull Request','Code Review PR — Semana 14','2026-04-07','2026-04-12',null],
    ['Sprint Report Mensual','Sprint Report Abril 2026','2026-04-24','2026-04-30',null],
  ];

  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;

    for (const [tplTitle, title, assigned, due, tlTitle] of tareasBase) {
      const tplId = TT[tplTitle];
      const tlId  = tlTitle ? TL[tlTitle] : null;
      const rand01 = Math.random();

      let status, progress, done;
      const duePast = new Date(due + 'T00:00:00Z') < new Date('2026-05-01T00:00:00Z');

      if (rand01 < perfil.taskRate) {
        status = 'completed'; progress = 100;
        const dueDate = new Date(due + 'T00:00:00Z');
        dueDate.setDate(dueDate.getDate() - rand(0, 3));
        done = dueDate.toISOString().slice(0, 10);
      } else if (duePast) {
        status = 'pending'; progress = 0; done = null;
      } else {
        status = rand01 < perfil.taskRate + 0.2 ? 'in-progress' : 'pending';
        progress = status === 'in-progress' ? rand(20, 70) : 0;
        done = null;
      }

      await sql`INSERT INTO tasks (id,template_id,user_id,assigned_by,title,description,status,progress,assigned_date,due_date,completed_date,training_line_id,created_at)
        VALUES (${uuid()},${tplId},${uid},${A},${title},'',${status},${progress},${assigned},${due},${done},${tlId},${assigned+'T08:00:00Z'})`;
    }
  }

  // ── Evaluaciones con resultados ────────────────────────────────────────────
  console.log('📊  Completando evaluaciones...');

  // Clima Q1 — completar las pendientes del base
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    const score = rand(perfil.evalScore[0] - 5, perfil.evalScore[0]);
    await sql`UPDATE evaluations SET status='completed', score=${score}, completed_date='2026-02-24'
      WHERE user_id=${uid} AND template_id=${ET['Evaluación de Clima Laboral Q1 2026']} AND status='pending'`;
  }

  // Desempeño Técnico Feb — asignar y completar para todos
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    const score = perfil.mejora >= 70 ? rand(perfil.evalScore[0], perfil.evalScore[1]) : null;
    const status = perfil.mejora >= 50 ? 'completed' : (perfil.mejora >= 30 ? 'in_progress' : 'pending');
    const done = status === 'completed' ? '2026-03-10' : null;
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,completed_date,score,max_score,created_at)
      VALUES (${uuid()},${ET['Evaluación de Desempeño Técnico — Feb 2026']},${uid},${A},
        ${status},'2026-02-15','2026-03-15',${done},${score},100,'2026-02-15T10:00:00Z')`;
  }

  // Competencias Técnicas — solo los que mejoran ≥ 50%
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid || perfil.mejora < 30) continue;
    const status = perfil.mejora >= 70 ? 'completed' : (perfil.mejora >= 50 ? 'in_progress' : 'pending');
    const score  = status === 'completed' ? rand(perfil.evalScore[0], perfil.evalScore[1]) : null;
    const done   = status === 'completed' ? '2026-04-05' : null;
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,completed_date,score,max_score,created_at)
      VALUES (${uuid()},${ET['Evaluación de Competencias Técnicas']},${uid},${A},
        ${status},'2026-03-01','2026-04-15',${done},${score},100,'2026-03-01T10:00:00Z')`;
  }

  // Desempeño Q2 — todos asignados, completados según perfil
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    const status = perfil.mejora >= 70 ? 'completed' : (perfil.mejora >= 30 ? 'in_progress' : 'pending');
    const score  = status === 'completed' ? rand(perfil.evalScore[0]+5, perfil.evalScore[1]) : null;
    const done   = status === 'completed' ? '2026-04-28' : null;
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,completed_date,score,max_score,created_at)
      VALUES (${uuid()},${ET['Evaluación de Desempeño Q2 2026']},${uid},${A},
        ${status},'2026-04-01','2026-05-31',${done},${score},100,'2026-04-01T10:00:00Z')`;
  }

  // ── Course Enrollments ─────────────────────────────────────────────────────
  console.log('🎒  Inscripciones a cursos...');

  const coursesByProfile = {
    'sofia.m90@techcraft.com': [
      { c: 'Git Flow y Code Review', tl: 'Onboarding Dev', done: '2026-02-28' },
      { c: 'TypeScript para Fullstack', tl: 'Onboarding Dev', done: '2026-03-15' },
      { c: 'React y Next.js Avanzado', tl: 'Frontend Excellence', done: '2026-04-10' },
      { c: 'Testing con Jest y Cypress', tl: 'Frontend Excellence', done: '2026-04-25' },
    ],
    'lucas.m90@techcraft.com': [
      { c: 'Git Flow y Code Review', tl: 'Onboarding Dev', done: '2026-03-01' },
      { c: 'TypeScript para Fullstack', tl: 'Onboarding Dev', done: '2026-03-18' },
      { c: 'React y Next.js Avanzado', tl: 'Frontend Excellence', done: '2026-04-15' },
      { c: 'Testing con Jest y Cypress', tl: 'Frontend Excellence', done: '2026-04-28' },
    ],
    'miguel.m70@techcraft.com': [
      { c: 'Git Flow y Code Review', tl: 'Onboarding Dev', done: '2026-03-05' },
      { c: 'TypeScript para Fullstack', tl: 'Onboarding Dev', done: '2026-03-25' },
      { c: 'Docker y Kubernetes', tl: 'DevOps & Backend Mastery', done: '2026-04-10' },
      { c: 'CI/CD con GitHub Actions', tl: 'DevOps & Backend Mastery', done: null },  // in_progress
    ],
    'camila.m70@techcraft.com': [
      { c: 'Git Flow y Code Review', tl: 'Onboarding Dev', done: '2026-03-08' },
      { c: 'TypeScript para Fullstack', tl: 'Onboarding Dev', done: '2026-03-28' },
      { c: 'Docker y Kubernetes', tl: 'DevOps & Backend Mastery', done: '2026-04-20' },
    ],
    'andres.m50@techcraft.com': [
      { c: 'Git Flow y Code Review', tl: 'Onboarding Dev', done: '2026-03-15' },
      { c: 'TypeScript para Fullstack', tl: 'Onboarding Dev', done: null },           // in_progress
    ],
    'natalia.m30@techcraft.com': [
      { c: 'Git Flow y Code Review', tl: 'Onboarding Dev', done: '2026-03-28' },
      { c: 'Docker y Kubernetes', tl: 'DevOps & Backend Mastery', done: null },
    ],
    'roberto.sm@techcraft.com':   [],  // Sin mejora: no completó cursos
    'isabella.rg@techcraft.com':  [],  // Regresión: no completó cursos
  };

  for (const [email, cursos] of Object.entries(coursesByProfile)) {
    const uid = U[email];
    if (!uid) continue;
    for (const { c, tl, done } of cursos) {
      const cid  = C[c];
      const tlId = TL[tl];
      const status = done ? 'completed' : 'in_progress';
      await sql`INSERT INTO course_enrollments (user_id,course_id,training_line_id,status,completed_at)
        VALUES (${uid},${cid},${tlId},${status},${done ? done+'T00:00:00Z' : null})
        ON CONFLICT (user_id,course_id,training_line_id) DO NOTHING`;
    }
  }

  // ── Training Line Progress (actualizar) ───────────────────────────────────
  console.log('📈  Actualizando progreso de líneas...');
  const progressByUser = {
    'sofia.m90@techcraft.com':   [['Onboarding Dev',3,3],['Frontend Excellence',3,2]],
    'lucas.m90@techcraft.com':   [['Onboarding Dev',3,3],['Frontend Excellence',3,2]],
    'miguel.m70@techcraft.com':  [['Onboarding Dev',3,3],['DevOps & Backend Mastery',4,2]],
    'camila.m70@techcraft.com':  [['Onboarding Dev',3,3],['DevOps & Backend Mastery',4,2]],
    'andres.m50@techcraft.com':  [['Onboarding Dev',3,2]],
    'natalia.m30@techcraft.com': [['Onboarding Dev',3,2],['DevOps & Backend Mastery',4,1]],
    'roberto.sm@techcraft.com':  [['Onboarding Dev',3,0]],
    'isabella.rg@techcraft.com': [['Onboarding Dev',3,0]],
  };
  for (const [email, lines] of Object.entries(progressByUser)) {
    const uid = U[email];
    if (!uid) continue;
    for (const [lineName, total, completed] of lines) {
      const tlId = TL[lineName];
      await sql`INSERT INTO training_line_progress (user_id,training_line_id,total_items,completed_items,last_updated)
        VALUES (${uid},${tlId},${total},${completed},NOW())
        ON CONFLICT (user_id,training_line_id) DO UPDATE SET completed_items=EXCLUDED.completed_items, last_updated=NOW()`;
    }
  }

  // ── Productivity Metrics ───────────────────────────────────────────────────
  console.log('📊  Generando métricas de productividad por trayectoria...');
  for (const [email, perfil] of Object.entries(PERFILES)) {
    const uid = U[email];
    if (!uid) continue;
    for (let d = 0; d < days.length; d++) {
      const score    = trayectoria(d, total, perfil.base, perfil.mejora);
      const assigned = rand(1, 3);
      const completed = Math.random() < perfil.taskRate ? rand(1, assigned) : 0;
      await sql`INSERT INTO productivity_metrics (id,user_id,date,tasks_completed,tasks_assigned,total_work_time,productivity_score,created_at)
        VALUES (${uuid()},${uid},${days[d]},${completed},${assigned},${rand(240,490)},${score},${days[d]+'T18:00:00Z'})
        ON CONFLICT (user_id,date) DO NOTHING`;
    }
  }

  // ── Work Sessions ──────────────────────────────────────────────────────────
  console.log('⏱  Sesiones de trabajo...');
  for (const uid of allU) {
    for (const day of days) {
      if (Math.random() < 0.06) continue;
      await sql`INSERT INTO work_sessions (user_id,session_date,duration)
        VALUES (${uid},${day},${rand(280,490)}) ON CONFLICT (user_id,session_date) DO NOTHING`;
    }
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  console.log('🏅  Certificaciones...');
  await sql`INSERT INTO certifications (id,user_id,course_id,title,issuer,issued_date,expiry_date,credential_url,file_url,verified) VALUES
    (${uuid()},${U['sofia.m90@techcraft.com']}, ${C['Git Flow y Code Review']},       'Git Flow y Code Review — Certificado','TechCraft Solutions','2026-02-28',null,null,null,true),
    (${uuid()},${U['sofia.m90@techcraft.com']}, ${C['TypeScript para Fullstack']},    'TypeScript para Fullstack — Udemy','Udemy Business','2026-03-15',null,'https://udemy.com/cert/ts-sofia',null,true),
    (${uuid()},${U['sofia.m90@techcraft.com']}, ${C['React y Next.js Avanzado']},     'React y Next.js Avanzado — Udemy','Udemy Business','2026-04-10',null,'https://udemy.com/cert/react-sofia',null,false),
    (${uuid()},${U['lucas.m90@techcraft.com']}, ${C['Git Flow y Code Review']},       'Git Flow y Code Review — Certificado','TechCraft Solutions','2026-03-01',null,null,null,true),
    (${uuid()},${U['lucas.m90@techcraft.com']}, ${C['TypeScript para Fullstack']},    'TypeScript para Fullstack — Udemy','Udemy Business','2026-03-18',null,'https://udemy.com/cert/ts-lucas',null,true),
    (${uuid()},${U['miguel.m70@techcraft.com']},${C['Git Flow y Code Review']},       'Git Flow y Code Review — Certificado','TechCraft Solutions','2026-03-05',null,null,null,true),
    (${uuid()},${U['miguel.m70@techcraft.com']},${C['Docker y Kubernetes']},          'Docker y Kubernetes — Coursera','Coursera','2026-04-10','2028-04-10','https://coursera.org/verify/docker-miguel',null,false),
    (${uuid()},${U['camila.m70@techcraft.com']},${C['Docker y Kubernetes']},          'Docker y Kubernetes — Coursera','Coursera','2026-04-20','2028-04-20','https://coursera.org/verify/docker-camila',null,false)
  `;

  // ── ROI Snapshots ──────────────────────────────────────────────────────────
  console.log('💰  ROI snapshots...');
  const roiData = [
    { e:'sofia.m90@techcraft.com',  tl:'Onboarding Dev',          snap:'2026-02-01',cost:22, prod:52, eval:0,  tasks:0  },
    { e:'lucas.m90@techcraft.com',  tl:'Onboarding Dev',          snap:'2026-02-01',cost:22, prod:52, eval:0,  tasks:0  },
    { e:'miguel.m70@techcraft.com', tl:'Onboarding Dev',          snap:'2026-02-01',cost:22, prod:52, eval:0,  tasks:0  },
    { e:'camila.m70@techcraft.com', tl:'Onboarding Dev',          snap:'2026-02-01',cost:22, prod:52, eval:0,  tasks:0  },
    { e:'andres.m50@techcraft.com', tl:'Onboarding Dev',          snap:'2026-02-03',cost:22, prod:52, eval:0,  tasks:0  },
    { e:'natalia.m30@techcraft.com',tl:'Onboarding Dev',          snap:'2026-02-03',cost:22, prod:52, eval:0,  tasks:0  },
    { e:'sofia.m90@techcraft.com',  tl:'Frontend Excellence',     snap:'2026-02-05',cost:20, prod:55, eval:0,  tasks:50 },
    { e:'lucas.m90@techcraft.com',  tl:'Frontend Excellence',     snap:'2026-02-05',cost:20, prod:53, eval:0,  tasks:48 },
    { e:'miguel.m70@techcraft.com', tl:'DevOps & Backend Mastery',snap:'2026-02-10',cost:33, prod:54, eval:0,  tasks:52 },
    { e:'camila.m70@techcraft.com', tl:'DevOps & Backend Mastery',snap:'2026-02-10',cost:33, prod:53, eval:0,  tasks:50 },
    { e:'natalia.m30@techcraft.com',tl:'DevOps & Backend Mastery',snap:'2026-02-10',cost:15, prod:52, eval:0,  tasks:45 },
  ];
  for (const r of roiData) {
    const uid = U[r.e];
    const tlId = TL[r.tl];
    if (!uid || !tlId) continue;
    await sql`INSERT INTO training_roi_snapshots (user_id,training_line_id,snapshot_date,avg_productivity,avg_eval_score,tasks_completion_pct,training_cost)
      VALUES (${uid},${tlId},${r.snap},${r.prod},${r.eval},${r.tasks},${r.cost})
      ON CONFLICT (user_id,training_line_id) DO NOTHING`;
  }

  // ── Resumen y análisis ROI ─────────────────────────────────────────────────
  const c = (await sql`SELECT
    (SELECT COUNT(*) FROM tasks WHERE status='completed') AS tasks_completadas,
    (SELECT COUNT(*) FROM evaluations WHERE status='completed') AS evals_completadas,
    (SELECT COUNT(*) FROM productivity_metrics) AS metricas,
    (SELECT COUNT(*) FROM work_sessions) AS sesiones,
    (SELECT COUNT(*) FROM course_enrollments WHERE status='completed') AS cursos_completados,
    (SELECT COUNT(*) FROM certifications) AS certificaciones,
    (SELECT COUNT(*) FROM training_roi_snapshots) AS roi_snapshots
  `)[0];

  console.log('\n✅  sf-02-progresion completado — 3 meses de actividad agregados\n');
  console.log('📊  Registros nuevos:');
  Object.entries(c).forEach(([k,v]) => console.log(`   ${k.padEnd(25)} ${v}`));

  console.log('\n📈  Trayectorias de productividad esperadas:');
  console.log('   sofia.m90 / lucas.m90      →  52 → ~98  (Mejora 90%)');
  console.log('   miguel.m70 / camila.m70    →  52 → ~88  (Mejora 70%)');
  console.log('   andres.m50                 →  52 → ~78  (Mejora 50%)');
  console.log('   natalia.m30                →  52 → ~68  (Mejora 30%)');
  console.log('   roberto.sm                 →  55 → ~55  (Sin Mejora)');
  console.log('   isabella.rg                →  68 → ~54  (Regresión -20%)');
  console.log('\n💡  El panel de ROI en /dashboard/admin muestra la correlación');
  console.log('    entre formación completada y mejora de productividad.');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
