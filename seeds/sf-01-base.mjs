#!/usr/bin/env node
/**
 * SEED 1/2 — Software Factory "TechCraft Solutions" — ESTADO INICIAL (Día 1)
 *
 * Qué hace: limpia TODA la DB e inserta la estructura base del escenario.
 *   - 2 admins + 8 usuarios con perfiles de mejora descriptivos
 *   - Sectores, proveedores, 10 cursos, 3 líneas de formación
 *   - Tareas y evaluaciones asignadas pero pendientes (sistema recién instalado)
 *
 * Ejecutar PRIMERO. Luego correr sf-02-progresion.mjs para agregar 3 meses de actividad.
 *
 * Desde login-user/:
 *   node seeds/sf-01-base.mjs
 */
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
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
if (!process.env.DATABASE_URL) { console.error('❌  DATABASE_URL no configurado'); process.exit(1); }

const sql  = neon(process.env.DATABASE_URL);
const hash = (pw) => bcrypt.hash(pw, 10);
const uuid = () => crypto.randomUUID();

async function main() {
  // ── Limpieza total ─────────────────────────────────────────────────────────
  console.log('🗑  Limpiando DB...');
  await sql`DELETE FROM training_roi_snapshots`;
  await sql`DELETE FROM certifications`;
  await sql`DELETE FROM training_line_progress`;
  await sql`DELETE FROM course_enrollments`;
  await sql`DELETE FROM training_line_items`;
  await sql`DELETE FROM training_line_sectors`;
  await sql`DELETE FROM evaluations`;
  await sql`DELETE FROM tasks`;
  await sql`DELETE FROM training_lines`;
  await sql`DELETE FROM evaluation_templates`;
  await sql`DELETE FROM task_templates`;
  await sql`DELETE FROM courses`;
  await sql`DELETE FROM providers`;
  await sql`DELETE FROM productivity_metrics`;
  await sql`DELETE FROM work_sessions`;
  await sql`DELETE FROM password_resets`;
  await sql`DELETE FROM verifications`;
  await sql`DELETE FROM resources`;
  await sql`DELETE FROM data_user`;
  await sql`DELETE FROM users`;
  await sql`DELETE FROM sectors`;
  console.log('✅  DB limpia\n');

  // ── Sectors ────────────────────────────────────────────────────────────────
  console.log('📂  Sectores...');
  await sql`INSERT INTO sectors (name) VALUES ('Frontend'),('Backend'),('QA / Testing'),('DevOps'),('Gestión de Proyectos')`;
  const S = Object.fromEntries((await sql`SELECT id, name FROM sectors`).map(r => [r.name, r.id]));

  // ── Providers ──────────────────────────────────────────────────────────────
  console.log('🏢  Proveedores...');
  await sql`INSERT INTO providers (name, website, contact) VALUES
    ('Coursera','https://coursera.org','partnerships@coursera.org'),
    ('Udemy Business','https://business.udemy.com','business@udemy.com'),
    ('LinkedIn Learning','https://linkedin.com/learning','enterprise@linkedin.com'),
    ('Formación Interna',null,null)
  `;
  const P = Object.fromEntries((await sql`SELECT id, name FROM providers`).map(r => [r.name, r.id]));

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤  Usuarios...');
  const pw = await hash('Teams2026!');
  const UID = {
    a1: uuid(), a2: uuid(),
    u1: uuid(), u2: uuid(), u3: uuid(), u4: uuid(),
    u5: uuid(), u6: uuid(), u7: uuid(), u8: uuid(),
  };

  // 8 usuarios con perfiles de mejora explícitos en nombre y email.
  // Los perfiles se verán reflejados en sf-02-progresion.mjs con métricas reales.
  await sql`INSERT INTO users (id, name, email, password_hash, role, verified, created_at) VALUES
    (${UID.a1},'Eduardo López (Admin)',      'emlopezgonzalez@gmail.com',  ${pw},'admin',true,'2026-02-01T08:00:00Z'),
    (${UID.a2},'Sebastián Soraire (Admin)',  'ssoraire@techcraft.com',     ${pw},'admin',true,'2026-02-01T08:00:00Z'),
    (${UID.u1},'Sofía — Mejora 90%',         'sofia.m90@techcraft.com',    ${pw},'user', true,'2026-02-01T09:00:00Z'),
    (${UID.u2},'Lucas — Mejora 90%',         'lucas.m90@techcraft.com',    ${pw},'user', true,'2026-02-01T09:00:00Z'),
    (${UID.u3},'Miguel — Mejora 70%',        'miguel.m70@techcraft.com',   ${pw},'user', true,'2026-02-01T09:00:00Z'),
    (${UID.u4},'Camila — Mejora 70%',        'camila.m70@techcraft.com',   ${pw},'user', true,'2026-02-01T09:00:00Z'),
    (${UID.u5},'Andrés — Mejora 50%',        'andres.m50@techcraft.com',   ${pw},'user', true,'2026-02-03T09:00:00Z'),
    (${UID.u6},'Natalia — Mejora 30%',       'natalia.m30@techcraft.com',  ${pw},'user', true,'2026-02-03T09:00:00Z'),
    (${UID.u7},'Roberto — Sin Mejora',       'roberto.sm@techcraft.com',   ${pw},'user', true,'2026-02-03T09:00:00Z'),
    (${UID.u8},'Isabella — Regresión -20%',  'isabella.rg@techcraft.com',  ${pw},'user', true,'2026-02-03T09:00:00Z')
  `;

  await sql`INSERT INTO data_user (id, user_id, first_name, last_name, phone, bio, country, city, sector_id) VALUES
    (${uuid()},${UID.a1},'Eduardo','López','+54 381 500-0001','CTO de TechCraft Solutions. Diseña el plan de formación del equipo.','Argentina','Tucumán',${S['Gestión de Proyectos']}),
    (${uuid()},${UID.a2},'Sebastián','Soraire','+54 381 500-0002','Engineering Manager. Supervisa los KPIs y desempeño del equipo técnico.','Argentina','Tucumán',${S['Gestión de Proyectos']}),
    (${uuid()},${UID.u1},'Sofía','M90','+54 381 500-0101','Dev Frontend. Perfil de alta mejora: completa todas las formaciones y evaluaciones asignadas.','Argentina','Tucumán',${S['Frontend']}),
    (${uuid()},${UID.u2},'Lucas','M90','+54 381 500-0102','Dev Frontend. Perfil de alta mejora: muy proactivo con cursos y tareas.','Argentina','Tucumán',${S['Frontend']}),
    (${uuid()},${UID.u3},'Miguel','M70','+54 381 500-0103','Dev Backend. Perfil de mejora moderada-alta: completa la mayoría de formaciones.','Argentina','Tucumán',${S['Backend']}),
    (${uuid()},${UID.u4},'Camila','M70','+54 381 500-0104','Dev Backend. Perfil de mejora moderada-alta: buen ritmo de aprendizaje.','Argentina','Tucumán',${S['Backend']}),
    (${uuid()},${UID.u5},'Andrés','M50','+54 381 500-0105','QA Engineer. Perfil de mejora media: completa parte de la formación asignada.','Argentina','Tucumán',${S['QA / Testing']}),
    (${uuid()},${UID.u6},'Natalia','M30','+54 381 500-0106','DevOps. Perfil de mejora leve: avanza despacio con los cursos.','Argentina','Tucumán',${S['DevOps']}),
    (${uuid()},${UID.u7},'Roberto','SM','+54 381 500-0107','Tech Lead. Sin mejora: no completa formaciones, performance estancada.','Argentina','Tucumán',${S['Gestión de Proyectos']}),
    (${uuid()},${UID.u8},'Isabella','RG','+54 381 500-0108','Fullstack. Regresión: carga de trabajo excesiva, sin formación, métricas en baja.','Argentina','Tucumán',${S['Backend']})
  `;

  // ── Task Templates ─────────────────────────────────────────────────────────
  console.log('📝  Task templates...');
  const TT = { informe: uuid(), entorno: uuid(), pr: uuid(), docs: uuid(), feature: uuid() };
  await sql`INSERT INTO task_templates (id, title, description, type, estimated_hours, requirements, created_by, created_at) VALUES
    (${TT.informe},'Sprint Report Mensual',
      'Reporte de progreso: tickets completados, velocidad del equipo y obstáculos del sprint.',
      'report',2,'["Resumen de tickets completados","Métricas de velocidad","Impedimentos y deuda técnica","Plan del próximo sprint"]',
      ${UID.a1},'2026-02-01T09:00:00Z'),
    (${TT.entorno},'Configurar Entorno de Desarrollo',
      'Setup completo del entorno local con dependencias, env vars, DB y ejecución de tests.',
      'project',4,'["Ejecutar npm install","Configurar .env.local","Correr migraciones de DB","Verificar que todos los tests pasen"]',
      ${UID.a1},'2026-02-01T09:00:00Z'),
    (${TT.pr},'Code Review — Pull Request',
      'Revisar pull requests aplicando los estándares de calidad del equipo.',
      'report',1,'["Revisar 2 PRs por semana mínimo","Verificar cobertura de tests","Dejar comentarios constructivos"]',
      ${UID.a2},'2026-02-01T09:00:00Z'),
    (${TT.docs},'Documentar Módulo API',
      'Documentar endpoints del módulo asignado con OpenAPI/Swagger.',
      'report',3,'["Documentar todos los endpoints","Incluir ejemplos de request/response","Documentar errores posibles"]',
      ${UID.a2},'2026-02-01T09:00:00Z'),
    (${TT.feature},'Implementar Feature Nueva',
      'Desarrollar funcionalidad con tests, code review y deploy a staging.',
      'project',8,'["Tests unitarios >80% cobertura","Code review aprobado por 2 personas","Deploy exitoso a staging"]',
      ${UID.a1},'2026-02-01T09:00:00Z')
  `;

  // ── Evaluation Templates ───────────────────────────────────────────────────
  console.log('📊  Evaluation templates...');
  const ET = { clima: uuid(), desIT: uuid(), skills: uuid(), desQ2: uuid() };
  await sql`INSERT INTO evaluation_templates (id, title, description, type, status, created_by, due_date, online, max_score, created_at) VALUES
    (${ET.clima},'Evaluación de Clima Laboral Q1 2026',
      'Encuesta anónima de satisfacción, bienestar y ambiente del equipo técnico.',
      'environment','active',${UID.a1},'2026-02-28',false,100,'2026-02-01T10:00:00Z'),
    (${ET.desIT},'Evaluación de Desempeño Técnico — Feb 2026',
      'Evaluación individual: calidad de código, productividad y colaboración.',
      'performance','draft',${UID.a1},'2026-03-15',false,100,'2026-02-01T10:00:00Z'),
    (${ET.skills},'Evaluación de Competencias Técnicas',
      'Skills: arquitectura, testing, DevOps, seguridad y buenas prácticas.',
      'skills','draft',${UID.a2},'2026-04-15',false,100,'2026-02-01T10:00:00Z'),
    (${ET.desQ2},'Evaluación de Desempeño Q2 2026',
      'Evaluación integral Q2: metas personales, impacto técnico y liderazgo.',
      'performance','draft',${UID.a1},'2026-05-31',false,100,'2026-02-01T10:00:00Z')
  `;

  // ── Courses ────────────────────────────────────────────────────────────────
  console.log('🎓  Cursos...');
  const C = { git: uuid(), ts: uuid(), react: uuid(), node: uuid(), sql: uuid(), docker: uuid(), cicd: uuid(), testing: uuid(), security: uuid(), scrum: uuid() };
  await sql`INSERT INTO courses (id, title, description, source, provider_id, url, duration_h, cost_per_user, currency, created_by, created_at) VALUES
    (${C.git},    'Git Flow y Code Review','Branching, rebase, resolución de conflictos y buenas prácticas de code review.',
                  'internal',${P['Formación Interna']},null,4,0,'ARS',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.ts},     'TypeScript para Fullstack','Tipos genéricos, decoradores, integración con React y Node.js.',
                  'external',${P['Udemy Business']},'https://udemy.com/course/typescript-fullstack',15,12,'USD',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.react},  'React y Next.js Avanzado','Server Components, App Router, performance y arquitectura frontend.',
                  'external',${P['Udemy Business']},'https://udemy.com/course/react-nextjs-avanzado',20,12,'USD',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.node},   'Node.js y APIs REST','Express, middlewares, JWT, manejo de errores y API design.',
                  'external',${P['Udemy Business']},'https://udemy.com/course/nodejs-api-rest',18,10,'USD',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.sql},    'SQL Avanzado y Optimización','Índices, EXPLAIN ANALYZE, CTEs, window functions.',
                  'external',${P['Udemy Business']},'https://udemy.com/course/sql-avanzado',10,10,'USD',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.docker}, 'Docker y Kubernetes','Contenedores, orquestación, Helm charts, Prometheus.',
                  'external',${P['Coursera']},'https://coursera.org/learn/docker-kubernetes',25,15,'USD',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.cicd},   'CI/CD con GitHub Actions','Pipelines, secrets, deploy automático a staging y producción.',
                  'external',${P['LinkedIn Learning']},'https://linkedin.com/learning/github-actions',8,8,'USD',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.testing},'Testing con Jest y Cypress','Unit, integration, E2E, mocking y cobertura de código.',
                  'external',${P['LinkedIn Learning']},'https://linkedin.com/learning/jest-cypress',12,8,'USD',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.security},'Seguridad en Aplicaciones Web','OWASP Top 10, autenticación segura, XSS, CSRF, auditoría.',
                  'external',${P['LinkedIn Learning']},'https://linkedin.com/learning/web-security',6,8,'USD',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.scrum},  'Scrum Master Certification','Roles, ceremonias, artefactos, métricas ágiles e impedimentos.',
                  'external',${P['Coursera']},'https://coursera.org/learn/scrum-master',20,15,'USD',${UID.a2},'2026-02-01T09:00:00Z')
  `;

  // ── Training Lines ─────────────────────────────────────────────────────────
  console.log('🗂  Líneas de formación...');
  const TL = { onboarding: uuid(), frontend: uuid(), devops: uuid() };
  await sql`INSERT INTO training_lines (id, title, description, mandatory, created_by, created_at) VALUES
    (${TL.onboarding},'Onboarding Dev',
      'Obligatorio para todos los nuevos desarrolladores. Herramientas, estándares y setup del entorno.',
      true,${UID.a1},'2026-02-01T09:00:00Z'),
    (${TL.frontend},'Frontend Excellence',
      'Programa de excelencia: React avanzado, testing y performance para el equipo frontend.',
      false,${UID.a2},'2026-02-01T09:00:00Z'),
    (${TL.devops},'DevOps & Backend Mastery',
      'Containerización, CI/CD, optimización de DB y seguridad en el stack backend.',
      false,${UID.a2},'2026-02-01T09:00:00Z')
  `;
  await sql`INSERT INTO training_line_sectors (training_line_id, sector_id) VALUES
    (${TL.onboarding},${S['Frontend']}),(${TL.onboarding},${S['Backend']}),(${TL.onboarding},${S['QA / Testing']}),(${TL.onboarding},${S['DevOps']}),
    (${TL.frontend},${S['Frontend']}),
    (${TL.devops},${S['Backend']}),(${TL.devops},${S['DevOps']})
  `;
  const TLI = Array.from({length:10}, uuid);
  await sql`INSERT INTO training_line_items (id, training_line_id, item_type, course_id, evaluation_template_id, task_template_id, order_index) VALUES
    (${TLI[0]},${TL.onboarding},'task',   null,null,${TT.entorno},  1),
    (${TLI[1]},${TL.onboarding},'course', ${C.git},null,null,       2),
    (${TLI[2]},${TL.onboarding},'course', ${C.ts}, null,null,       3),
    (${TLI[3]},${TL.frontend},  'course', ${C.react},  null,null,   1),
    (${TLI[4]},${TL.frontend},  'course', ${C.testing},null,null,   2),
    (${TLI[5]},${TL.frontend},  'evaluation',null,${ET.skills},null,3),
    (${TLI[6]},${TL.devops},    'course', ${C.docker},  null,null,  1),
    (${TLI[7]},${TL.devops},    'course', ${C.cicd},    null,null,  2),
    (${TLI[8]},${TL.devops},    'course', ${C.sql},     null,null,  3),
    (${TLI[9]},${TL.devops},    'course', ${C.security},null,null,  4)
  `;

  // ── Estado inicial: tareas pendientes (Día 1) ─────────────────────────────
  console.log('📋  Tareas iniciales (pendientes)...');
  const allU = [UID.u1,UID.u2,UID.u3,UID.u4,UID.u5,UID.u6,UID.u7,UID.u8];
  for (const uid of allU) {
    await sql`INSERT INTO tasks (id,template_id,user_id,assigned_by,title,description,status,progress,assigned_date,due_date,training_line_id,created_at)
      VALUES (${uuid()},${TT.entorno},${uid},${UID.a1},'Configurar Entorno de Desarrollo','',
        'pending',0,'2026-02-01','2026-02-10',${TL.onboarding},'2026-02-01T09:00:00Z')`;
  }

  // ── Estado inicial: evaluación de clima asignada (pendiente) ──────────────
  console.log('📊  Evaluaciones iniciales (pendientes)...');
  for (const uid of allU) {
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,score,max_score,created_at)
      VALUES (${uuid()},${ET.clima},${uid},${UID.a1},'pending','2026-02-01','2026-02-28',null,100,'2026-02-01T10:00:00Z')`;
  }

  // ── Estado inicial: inscripciones a líneas (enrolled, 0 progreso) ─────────
  console.log('🎒  Inscripciones iniciales...');
  // Todos → Onboarding
  for (const uid of allU) {
    await sql`INSERT INTO training_line_progress (user_id,training_line_id,total_items,completed_items,last_updated)
      VALUES (${uid},${TL.onboarding},3,0,'2026-02-01T09:00:00Z') ON CONFLICT (user_id,training_line_id) DO NOTHING`;
  }
  // Frontend users → Frontend line
  for (const uid of [UID.u1,UID.u2]) {
    await sql`INSERT INTO training_line_progress (user_id,training_line_id,total_items,completed_items,last_updated)
      VALUES (${uid},${TL.frontend},3,0,'2026-02-01T09:00:00Z') ON CONFLICT (user_id,training_line_id) DO NOTHING`;
  }
  // Backend + DevOps → DevOps line
  for (const uid of [UID.u3,UID.u4,UID.u6,UID.u8]) {
    await sql`INSERT INTO training_line_progress (user_id,training_line_id,total_items,completed_items,last_updated)
      VALUES (${uid},${TL.devops},4,0,'2026-02-01T09:00:00Z') ON CONFLICT (user_id,training_line_id) DO NOTHING`;
  }

  // ── Resumen ────────────────────────────────────────────────────────────────
  const c = (await sql`SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM sectors) AS sectors,
    (SELECT COUNT(*) FROM providers) AS providers,
    (SELECT COUNT(*) FROM courses) AS courses,
    (SELECT COUNT(*) FROM training_lines) AS training_lines,
    (SELECT COUNT(*) FROM training_line_items) AS tl_items,
    (SELECT COUNT(*) FROM task_templates) AS task_templates,
    (SELECT COUNT(*) FROM tasks) AS tasks,
    (SELECT COUNT(*) FROM evaluation_templates) AS eval_templates,
    (SELECT COUNT(*) FROM evaluations) AS evaluaciones,
    (SELECT COUNT(*) FROM training_line_progress) AS inscripciones
  `)[0];

  console.log('\n✅  sf-01-base completado — Estado: Día 1, sistema recién configurado\n');
  console.log('📊  Registros insertados:');
  Object.entries(c).forEach(([k,v]) => console.log(`   ${k.padEnd(20)} ${v}`));
  console.log('\n🔑  Contraseña: Teams2026!');
  console.log('   Admins: emlopezgonzalez@gmail.com | ssoraire@techcraft.com');
  console.log('   Users:  sofia.m90 | lucas.m90 | miguel.m70 | camila.m70 |');
  console.log('           andres.m50 | natalia.m30 | roberto.sm | isabella.rg  @techcraft.com');
  console.log('\n▶  Siguiente paso: node seeds/sf-02-progresion.mjs');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
