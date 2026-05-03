#!/usr/bin/env node
/**
 * SEED 1/2 — Oficina Administrativa "Municipalidad de San Miguel" — ESTADO INICIAL
 *
 * Escenario: organismo público con tareas administrativas, gestión documental
 * y digitalización de procesos. El ROI se mide en eficiencia operativa y
 * reducción de errores en trámites.
 *
 * Ejecutar PRIMERO. Luego correr oficina-02-progresion.mjs.
 *
 * Desde login-user/:
 *   node seeds/oficina-01-base.mjs
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
  await sql`INSERT INTO sectors (name) VALUES
    ('Atención al Ciudadano'),
    ('Contabilidad y Finanzas'),
    ('Recursos Humanos'),
    ('Mesa de Entradas y Legales'),
    ('Administración General')
  `;
  const S = Object.fromEntries((await sql`SELECT id, name FROM sectors`).map(r => [r.name, r.id]));

  // ── Providers ──────────────────────────────────────────────────────────────
  console.log('🏢  Proveedores...');
  await sql`INSERT INTO providers (name, website, contact) VALUES
    ('INAP — Instituto Nacional','https://inap.gob.ar','capacitacion@inap.gob.ar'),
    ('Udemy Business',           'https://business.udemy.com','business@udemy.com'),
    ('LinkedIn Learning',        'https://linkedin.com/learning','enterprise@linkedin.com'),
    ('Formación Interna',        null,null)
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

  await sql`INSERT INTO users (id, name, email, password_hash, role, verified, created_at) VALUES
    (${UID.a1},'Eduardo López (Admin)',       'emlopezgonzalez@gmail.com',       ${pw},'admin',true,'2026-02-01T08:00:00Z'),
    (${UID.a2},'Patricia Guzmán (Admin)',     'pguzman@municipalidad.gob.ar',    ${pw},'admin',true,'2026-02-01T08:00:00Z'),
    (${UID.u1},'Fernanda — Mejora 90%',       'fernanda.m90@municipalidad.gob.ar',${pw},'user',true,'2026-02-01T09:00:00Z'),
    (${UID.u2},'Gustavo — Mejora 90%',        'gustavo.m90@municipalidad.gob.ar', ${pw},'user',true,'2026-02-01T09:00:00Z'),
    (${UID.u3},'Mariela — Mejora 70%',        'mariela.m70@municipalidad.gob.ar', ${pw},'user',true,'2026-02-01T09:00:00Z'),
    (${UID.u4},'Jorge — Mejora 70%',          'jorge.m70@municipalidad.gob.ar',   ${pw},'user',true,'2026-02-01T09:00:00Z'),
    (${UID.u5},'Claudia — Mejora 50%',        'claudia.m50@municipalidad.gob.ar', ${pw},'user',true,'2026-02-03T09:00:00Z'),
    (${UID.u6},'Ricardo — Mejora 30%',        'ricardo.m30@municipalidad.gob.ar', ${pw},'user',true,'2026-02-03T09:00:00Z'),
    (${UID.u7},'Silvia — Sin Mejora',         'silvia.sm@municipalidad.gob.ar',   ${pw},'user',true,'2026-02-03T09:00:00Z'),
    (${UID.u8},'Omar — Regresión -20%',       'omar.rg@municipalidad.gob.ar',     ${pw},'user',true,'2026-02-03T09:00:00Z')
  `;

  await sql`INSERT INTO data_user (id, user_id, first_name, last_name, phone, bio, country, city, sector_id) VALUES
    (${uuid()},${UID.a1},'Eduardo','López',     '+54 381 700-0001','Director de Modernización. Lidera el plan de capacitación y digitalización.','Argentina','San Miguel',${S['Administración General']}),
    (${uuid()},${UID.a2},'Patricia','Guzmán',   '+54 381 700-0002','Jefa de RRHH Municipal. Coordina evaluaciones de desempeño del personal.','Argentina','San Miguel',${S['Recursos Humanos']}),
    (${uuid()},${UID.u1},'Fernanda','M90',       '+54 381 700-0101','Agente de Atención al Ciudadano. Mejora 90%: adopta todas las herramientas digitales.','Argentina','San Miguel',${S['Atención al Ciudadano']}),
    (${uuid()},${UID.u2},'Gustavo','M90',        '+54 381 700-0102','Contador Municipal. Mejora 90%: actualiza todas sus competencias y normativas.','Argentina','San Miguel',${S['Contabilidad y Finanzas']}),
    (${uuid()},${UID.u3},'Mariela','M70',        '+54 381 700-0103','Responsable de RRHH. Mejora 70%: adopta mayormente los nuevos procesos.','Argentina','San Miguel',${S['Recursos Humanos']}),
    (${uuid()},${UID.u4},'Jorge','M70',          '+54 381 700-0104','Técnico Legal. Mejora 70%: aplica la mayoría de la normativa actualizada.','Argentina','San Miguel',${S['Mesa de Entradas y Legales']}),
    (${uuid()},${UID.u5},'Claudia','M50',        '+54 381 700-0105','Agente de Mesa de Entradas. Mejora 50%: adopta parcialmente los nuevos sistemas.','Argentina','San Miguel',${S['Mesa de Entradas y Legales']}),
    (${uuid()},${UID.u6},'Ricardo','M30',        '+54 381 700-0106','Agente de Atención. Mejora 30%: resistencia al cambio, adopción lenta.','Argentina','San Miguel',${S['Atención al Ciudadano']}),
    (${uuid()},${UID.u7},'Silvia','SM',          '+54 381 700-0107','Contadora. Sin mejora: no completó ninguna capacitación, trabaja con métodos anteriores.','Argentina','San Miguel',${S['Contabilidad y Finanzas']}),
    (${uuid()},${UID.u8},'Omar','RG',            '+54 381 700-0108','Técnico Legal. Regresión: sobrecarga de trabajo, no adoptó nuevos procesos.','Argentina','San Miguel',${S['Mesa de Entradas y Legales']})
  `;

  // ── Task Templates ─────────────────────────────────────────────────────────
  console.log('📝  Task templates...');
  const TT = { informe: uuid(), tramites: uuid(), circular: uuid(), relevamiento: uuid(), capacitar: uuid() };
  await sql`INSERT INTO task_templates (id, title, description, type, estimated_hours, requirements, created_by, created_at) VALUES
    (${TT.informe},     'Informe Mensual de Gestión',
      'Reporte de actividad mensual: trámites procesados, tiempos de respuesta y observaciones.',
      'report',2,'["Cantidad de trámites procesados en el mes","Tiempo promedio de resolución","Casos pendientes y motivos","Propuestas de mejora"]',
      ${UID.a1},'2026-02-01T09:00:00Z'),
    (${TT.tramites},    'Actualizar Archivo Documental',
      'Digitalizar y clasificar expedientes físicos en el sistema de gestión documental.',
      'project',3,'["Digitalizar al menos 50 expedientes","Clasificar según nomenclador vigente","Verificar integridad de los archivos digitalizados"]',
      ${UID.a1},'2026-02-01T09:00:00Z'),
    (${TT.circular},    'Elaborar Circular Interna',
      'Redactar y distribuir una comunicación oficial interna sobre normativas o procesos.',
      'report',1,'["Redacción según manual de estilo institucional","Revisión por superior antes del envío","Registro en el libro de circulares"]',
      ${UID.a2},'2026-02-01T09:00:00Z'),
    (${TT.relevamiento},'Relevamiento de Trámites Digitales',
      'Mapear los trámites del área susceptibles de ser digitalizados.',
      'report',2,'["Listar todos los trámites del área","Identificar cuáles pueden digitalizarse","Estimar impacto en tiempo de atención"]',
      ${UID.a2},'2026-02-01T09:00:00Z'),
    (${TT.capacitar},   'Capacitar Nuevos Agentes',
      'Inducción al sector y capacitación en sistemas y normativa para nuevos integrantes.',
      'project',4,'["Presentación del área y funciones","Capacitación en sistema de gestión","Acompañamiento en primeros 5 días"]',
      ${UID.a1},'2026-02-01T09:00:00Z')
  `;

  // ── Evaluation Templates ───────────────────────────────────────────────────
  console.log('📊  Evaluation templates...');
  const ET = { clima: uuid(), atencion: uuid(), digital: uuid(), desempeno: uuid() };
  await sql`INSERT INTO evaluation_templates (id, title, description, type, status, created_by, due_date, online, max_score, created_at) VALUES
    (${ET.clima},     'Evaluación de Clima Institucional Q1',
      'Encuesta anónima sobre satisfacción laboral, clima y condiciones de trabajo.',
      'environment','active',${UID.a1},'2026-02-28',false,100,'2026-02-01T10:00:00Z'),
    (${ET.atencion},  'Evaluación de Atención al Ciudadano',
      'Calidad de atención: cordialidad, resolución de consultas y tiempos de respuesta.',
      'performance','draft',${UID.a2},'2026-03-31',false,100,'2026-02-01T10:00:00Z'),
    (${ET.digital},   'Evaluación de Competencias Digitales',
      'Manejo de sistemas informáticos, gestión documental digital y seguridad de la información.',
      'skills','draft',${UID.a1},'2026-04-15',false,100,'2026-02-01T10:00:00Z'),
    (${ET.desempeno}, 'Evaluación de Desempeño Anual 2026',
      'Evaluación integral: cumplimiento de objetivos, eficiencia y colaboración institucional.',
      'performance','draft',${UID.a1},'2026-05-31',false,100,'2026-02-01T10:00:00Z')
  `;

  // ── Courses ────────────────────────────────────────────────────────────────
  console.log('🎓  Cursos...');
  const C = {
    excel:    uuid(), gestionDoc: uuid(), atencion: uuid(),
    normativa:uuid(), redaccion:  uuid(), sistemasGob: uuid(),
    segInfo:  uuid(), accesib:    uuid(), tramitesWeb: uuid(), liderazgo: uuid(),
  };
  await sql`INSERT INTO courses (id, title, description, source, provider_id, url, duration_h, cost_per_user, currency, created_by, created_at) VALUES
    (${C.excel},      'Excel para Administración Pública',  'Tablas dinámicas, fórmulas para gestión presupuestaria, reportes automáticos.',
                      'external',${P['Udemy Business']},'https://udemy.com/course/excel-admin-publica',12,8,'USD',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.gestionDoc}, 'Gestión Documental Digital',          'Archivo digital, nomencladores, trazabilidad de expedientes y preservación.',
                      'external',${P['INAP — Instituto Nacional']},'https://inap.gob.ar/gestion-documental',8,0,'ARS',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.atencion},   'Atención al Ciudadano con Calidad',  'Comunicación efectiva, resolución de conflictos y estándares de atención.',
                      'internal',${P['Formación Interna']},null,6,0,'ARS',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.normativa},  'Normativa y Procedimientos 2026',     'Marco legal vigente, decreto 2026 y procedimientos administrativos actualizados.',
                      'external',${P['INAP — Instituto Nacional']},'https://inap.gob.ar/normativa-2026',4,0,'ARS',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.redaccion},  'Redacción Administrativa Profesional','Notas, circulares, informes y resoluciones: estructura, estilo y formato oficial.',
                      'internal',${P['Formación Interna']},null,6,0,'ARS',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.sistemasGob},'Sistemas de Gestión Municipal',       'GDE (Gestión Documental Electrónica), SIGAF y sistemas de expedientes digitales.',
                      'external',${P['INAP — Instituto Nacional']},'https://inap.gob.ar/sistemas-gob',10,0,'ARS',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.segInfo},    'Seguridad de la Información',         'Políticas de contraseñas, phishing, clasificación de información pública y privada.',
                      'external',${P['LinkedIn Learning']},'https://linkedin.com/learning/seguridad-info',6,8,'USD',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.accesib},    'Accesibilidad en Servicios Públicos', 'Estándares de accesibilidad universal: atención inclusiva y comunicación adaptada.',
                      'internal',${P['Formación Interna']},null,4,0,'ARS',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.tramitesWeb},'Gestión de Trámites Online',          'Plataforma ciudadana: carga de trámites, seguimiento y comunicación digital.',
                      'external',${P['INAP — Instituto Nacional']},'https://inap.gob.ar/tramites-online',5,0,'ARS',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.liderazgo},  'Liderazgo en el Sector Público',      'Gestión de equipos, motivación, comunicación institucional y toma de decisiones.',
                      'external',${P['INAP — Instituto Nacional']},'https://inap.gob.ar/liderazgo-publico',8,0,'ARS',${UID.a2},'2026-02-01T09:00:00Z')
  `;

  // ── Training Lines ─────────────────────────────────────────────────────────
  console.log('🗂  Líneas de formación...');
  const TL = { induccion: uuid(), digitalizacion: uuid(), actualNorm: uuid() };
  await sql`INSERT INTO training_lines (id, title, description, mandatory, created_by, created_at) VALUES
    (${TL.induccion},    'Inducción Institucional',
      'Obligatorio para todos los agentes: procesos, normativa y herramientas básicas del organismo.',
      true,${UID.a1},'2026-02-01T09:00:00Z'),
    (${TL.digitalizacion},'Digitalización de Procesos',
      'Capacitación en herramientas digitales para la modernización de trámites y gestión documental.',
      false,${UID.a2},'2026-02-01T09:00:00Z'),
    (${TL.actualNorm},   'Actualización Normativa y Contable',
      'Formación en normativas 2026, redacción administrativa y gestión financiera municipal.',
      false,${UID.a2},'2026-02-01T09:00:00Z')
  `;
  await sql`INSERT INTO training_line_sectors (training_line_id, sector_id) VALUES
    (${TL.induccion},     ${S['Atención al Ciudadano']}),(${TL.induccion},${S['Contabilidad y Finanzas']}),
    (${TL.induccion},     ${S['Recursos Humanos']}),(${TL.induccion},${S['Mesa de Entradas y Legales']}),(${TL.induccion},${S['Administración General']}),
    (${TL.digitalizacion},${S['Mesa de Entradas y Legales']}),(${TL.digitalizacion},${S['Atención al Ciudadano']}),(${TL.digitalizacion},${S['Administración General']}),
    (${TL.actualNorm},    ${S['Contabilidad y Finanzas']}),(${TL.actualNorm},${S['Mesa de Entradas y Legales']})
  `;
  const TLI = Array.from({length:9}, uuid);
  await sql`INSERT INTO training_line_items (id, training_line_id, item_type, course_id, evaluation_template_id, task_template_id, order_index) VALUES
    (${TLI[0]},${TL.induccion},    'course',    ${C.atencion},   null,null,1),
    (${TLI[1]},${TL.induccion},    'course',    ${C.normativa},  null,null,2),
    (${TLI[2]},${TL.induccion},    'course',    ${C.gestionDoc}, null,null,3),
    (${TLI[3]},${TL.digitalizacion},'course',   ${C.sistemasGob},null,null,1),
    (${TLI[4]},${TL.digitalizacion},'course',   ${C.tramitesWeb},null,null,2),
    (${TLI[5]},${TL.digitalizacion},'evaluation',null,${ET.digital},null,3),
    (${TLI[6]},${TL.actualNorm},   'course',    ${C.excel},      null,null,1),
    (${TLI[7]},${TL.actualNorm},   'course',    ${C.redaccion},  null,null,2),
    (${TLI[8]},${TL.actualNorm},   'course',    ${C.segInfo},    null,null,3)
  `;

  // ── Estado inicial ─────────────────────────────────────────────────────────
  console.log('📋  Estado inicial...');
  const allU = [UID.u1,UID.u2,UID.u3,UID.u4,UID.u5,UID.u6,UID.u7,UID.u8];
  for (const uid of allU) {
    await sql`INSERT INTO tasks (id,template_id,user_id,assigned_by,title,description,status,progress,assigned_date,due_date,created_at)
      VALUES (${uuid()},${TT.relevamiento},${uid},${UID.a1},'Relevamiento de Trámites del Área','',
        'pending',0,'2026-02-01','2026-02-14','2026-02-01T09:00:00Z')`;
  }
  for (const uid of allU) {
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,score,max_score,created_at)
      VALUES (${uuid()},${ET.clima},${uid},${UID.a1},'pending','2026-02-01','2026-02-28',null,100,'2026-02-01T10:00:00Z')`;
  }
  // Inscripciones iniciales (todos → Inducción; algunos → otras líneas)
  for (const uid of allU) {
    await sql`INSERT INTO training_line_progress (user_id,training_line_id,total_items,completed_items,last_updated)
      VALUES (${uid},${TL.induccion},3,0,'2026-02-01T09:00:00Z') ON CONFLICT (user_id,training_line_id) DO NOTHING`;
  }
  for (const uid of [UID.u1,UID.u2,UID.u5,UID.u6]) {
    await sql`INSERT INTO training_line_progress (user_id,training_line_id,total_items,completed_items,last_updated)
      VALUES (${uid},${TL.digitalizacion},3,0,'2026-02-01T09:00:00Z') ON CONFLICT (user_id,training_line_id) DO NOTHING`;
  }
  for (const uid of [UID.u2,UID.u4]) {
    await sql`INSERT INTO training_line_progress (user_id,training_line_id,total_items,completed_items,last_updated)
      VALUES (${uid},${TL.actualNorm},3,0,'2026-02-01T09:00:00Z') ON CONFLICT (user_id,training_line_id) DO NOTHING`;
  }

  // ── Resumen ────────────────────────────────────────────────────────────────
  const c = (await sql`SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM sectors) AS sectors,
    (SELECT COUNT(*) FROM courses) AS courses,
    (SELECT COUNT(*) FROM training_lines) AS training_lines,
    (SELECT COUNT(*) FROM tasks) AS tasks_pendientes,
    (SELECT COUNT(*) FROM evaluations) AS evals_pendientes
  `)[0];

  console.log('\n✅  oficina-01-base completado — Estado: Día 1\n');
  console.log('📊  Registros:', JSON.stringify(c, null, 2));
  console.log('\n🔑  Contraseña: Teams2026!');
  console.log('   Admins: emlopezgonzalez@gmail.com | pguzman@municipalidad.gob.ar');
  console.log('   Users:  fernanda.m90 | gustavo.m90 | mariela.m70 | jorge.m70 |');
  console.log('           claudia.m50 | ricardo.m30 | silvia.sm | omar.rg  @municipalidad.gob.ar');
  console.log('\n▶  Siguiente: node seeds/oficina-02-progresion.mjs');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
