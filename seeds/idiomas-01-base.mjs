#!/usr/bin/env node
/**
 * SEED 1/2 — Instituto de Idiomas "LinguaForward" — ESTADO INICIAL (Día 1)
 *
 * Escenario: instituto que capacita a empleados en inglés y alemán.
 * La formación tiene niveles progresivos (A1→B2), y el ROI se mide por
 * mejora en evaluaciones de nivel y desempeño general.
 *
 * Ejecutar PRIMERO. Luego correr idiomas-02-progresion.mjs.
 *
 * Desde login-user/:
 *   node seeds/idiomas-01-base.mjs
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
    ('Inglés — Inicial A1/A2'),
    ('Inglés — Intermedio B1'),
    ('Inglés — Avanzado B2/C1'),
    ('Alemán — Inicial A1/A2'),
    ('Alemán — Intermedio B1')
  `;
  const S = Object.fromEntries((await sql`SELECT id, name FROM sectors`).map(r => [r.name, r.id]));

  // ── Providers ──────────────────────────────────────────────────────────────
  console.log('🏢  Proveedores...');
  await sql`INSERT INTO providers (name, website, contact) VALUES
    ('Cambridge Assessment','https://cambridgeenglish.org','corporate@cambridge.org'),
    ('Berlitz Argentina',   'https://berlitz.com/ar',      'empresas@berlitz.com.ar'),
    ('Duolingo for Business','https://schools.duolingo.com','business@duolingo.com'),
    ('Formación Interna',   null,                          null)
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
    (${UID.a1},'Eduardo López (Admin)',      'emlopezgonzalez@gmail.com',    ${pw},'admin',true,'2026-02-01T08:00:00Z'),
    (${UID.a2},'Marta Schulz (Admin)',       'mschulz@linguaforward.com',    ${pw},'admin',true,'2026-02-01T08:00:00Z'),
    (${UID.u1},'Pablo — Mejora 90%',         'pablo.m90@linguaforward.com',  ${pw},'user', true,'2026-02-01T09:00:00Z'),
    (${UID.u2},'Carla — Mejora 90%',         'carla.m90@linguaforward.com',  ${pw},'user', true,'2026-02-01T09:00:00Z'),
    (${UID.u3},'Javier — Mejora 70%',        'javier.m70@linguaforward.com', ${pw},'user', true,'2026-02-01T09:00:00Z'),
    (${UID.u4},'Sofía — Mejora 70%',         'sofia.m70@linguaforward.com',  ${pw},'user', true,'2026-02-01T09:00:00Z'),
    (${UID.u5},'Diego — Mejora 50%',         'diego.m50@linguaforward.com',  ${pw},'user', true,'2026-02-03T09:00:00Z'),
    (${UID.u6},'Ana — Mejora 30%',           'ana.m30@linguaforward.com',    ${pw},'user', true,'2026-02-03T09:00:00Z'),
    (${UID.u7},'Nicolás — Sin Mejora',       'nicolas.sm@linguaforward.com', ${pw},'user', true,'2026-02-03T09:00:00Z'),
    (${UID.u8},'Laura — Regresión -20%',     'laura.rg@linguaforward.com',   ${pw},'user', true,'2026-02-03T09:00:00Z')
  `;

  await sql`INSERT INTO data_user (id, user_id, first_name, last_name, phone, bio, country, city, sector_id) VALUES
    (${uuid()},${UID.a1},'Eduardo','López',     '+54 381 600-0001','Director del Instituto LinguaForward. Diseña programas de capacitación.','Argentina','Tucumán',${S['Inglés — Avanzado B2/C1']}),
    (${uuid()},${UID.a2},'Marta','Schulz',      '+54 381 600-0002','Coordinadora académica. Bilingüe español-alemán. Gestiona los niveles.','Argentina','Tucumán',${S['Alemán — Intermedio B1']}),
    (${uuid()},${UID.u1},'Pablo','M90',         '+54 381 600-0101','Inglés A1 inicial. Mejora 90%: asiste a todas las clases, completa todos los ejercicios.','Argentina','Tucumán',${S['Inglés — Inicial A1/A2']}),
    (${uuid()},${UID.u2},'Carla','M90',         '+54 381 600-0102','Alemán A1 inicial. Mejora 90%: práctica diaria, muy comprometida con el aprendizaje.','Argentina','Tucumán',${S['Alemán — Inicial A1/A2']}),
    (${uuid()},${UID.u3},'Javier','M70',        '+54 381 600-0103','Inglés B1 intermedio. Mejora 70%: completa la mayoría de ejercicios y evaluaciones.','Argentina','Tucumán',${S['Inglés — Intermedio B1']}),
    (${uuid()},${UID.u4},'Sofía','M70',         '+54 381 600-0104','Alemán A2. Mejora 70%: ritmo constante de práctica y avance.','Argentina','Tucumán',${S['Alemán — Inicial A1/A2']}),
    (${uuid()},${UID.u5},'Diego','M50',         '+54 381 600-0105','Inglés A2. Mejora 50%: asiste regularmente pero con práctica irregular.','Argentina','Tucumán',${S['Inglés — Inicial A1/A2']}),
    (${uuid()},${UID.u6},'Ana','M30',           '+54 381 600-0106','Inglés B1. Mejora 30%: asistencia irregular, avanza lento.','Argentina','Tucumán',${S['Inglés — Intermedio B1']}),
    (${uuid()},${UID.u7},'Nicolás','SM',        '+54 381 600-0107','Inglés A2. Sin mejora: inasistencias, ejercicios sin completar.','Argentina','Tucumán',${S['Inglés — Inicial A1/A2']}),
    (${uuid()},${UID.u8},'Laura','RG',          '+54 381 600-0108','Inglés B1. Regresión: comenzó bien pero abandonó el programa.','Argentina','Tucumán',${S['Inglés — Intermedio B1']})
  `;

  // ── Task Templates ─────────────────────────────────────────────────────────
  console.log('📝  Task templates...');
  const TT = { conv: uuid(), writing: uuid(), listening: uuid(), oral: uuid(), diario: uuid() };
  await sql`INSERT INTO task_templates (id, title, description, type, estimated_hours, requirements, created_by, created_at) VALUES
    (${TT.conv},     'Práctica de Conversación',
      'Sesión de conversación guiada sobre temas del nivel asignado.',
      'report',1,'["Participar en al menos 15 minutos de conversación","Registrar vocabulario nuevo aprendido","Autoevaluar fluidez del 1 al 5"]',
      ${UID.a1},'2026-02-01T09:00:00Z'),
    (${TT.writing},  'Ejercicio de Writing',
      'Redactar un texto escrito según la consigna del nivel (email, ensayo, descripción).',
      'report',2,'["Texto de mínimo 150 palabras","Sin errores gramaticales graves","Vocabulario apropiado al nivel"]',
      ${UID.a1},'2026-02-01T09:00:00Z'),
    (${TT.listening},'Listening Comprehension',
      'Completar ejercicios de comprensión auditiva con el material asignado.',
      'report',1,'["Escuchar el audio asignado (mínimo 2 veces)","Completar el cuestionario de comprensión","Puntaje mínimo de aprobación: 70%"]',
      ${UID.a2},'2026-02-01T09:00:00Z'),
    (${TT.oral},     'Presentación Oral',
      'Exposición oral de 5 minutos sobre un tema asignado.',
      'project',3,'["Presentación de al menos 5 minutos","Pronunciación evaluada por el instructor","Usar vocabulario del nivel actual"]',
      ${UID.a2},'2026-02-01T09:00:00Z'),
    (${TT.diario},   'Diario de Aprendizaje Mensual',
      'Registro mensual del progreso: palabras aprendidas, dificultades y objetivos.',
      'report',1,'["Mínimo 5 entradas en el mes","Reflexión sobre dificultades encontradas","Objetivos para el próximo mes"]',
      ${UID.a1},'2026-02-01T09:00:00Z')
  `;

  // ── Evaluation Templates ───────────────────────────────────────────────────
  console.log('📊  Evaluation templates...');
  const ET = { diagnostico: uuid(), nivelA2: uuid(), oralB1: uuid(), finalAleman: uuid() };
  await sql`INSERT INTO evaluation_templates (id, title, description, type, status, created_by, due_date, online, max_score, created_at) VALUES
    (${ET.diagnostico},'Evaluación Diagnóstica de Nivel',
      'Test de nivel inicial para ubicar a cada participante en el programa correcto.',
      'skills','completed',${UID.a1},'2026-02-07',false,100,'2026-02-01T10:00:00Z'),
    (${ET.nivelA2},'Examen de Progreso — Nivel A2',
      'Evaluación de lectura, escritura y gramática para validar avance al nivel A2.',
      'skills','active',${UID.a2},'2026-03-31',false,100,'2026-02-01T10:00:00Z'),
    (${ET.oralB1},'Evaluación de Expresión Oral B1',
      'Entrevista oral de 15 minutos para evaluar fluidez y vocabulario nivel B1.',
      'performance','draft',${UID.a2},'2026-04-30',false,100,'2026-02-01T10:00:00Z'),
    (${ET.finalAleman},'Examen Final Módulo Alemán A1',
      'Evaluación integral del módulo A1 de alemán: lectura, escritura y comprensión oral.',
      'skills','draft',${UID.a1},'2026-04-30',false,100,'2026-02-01T10:00:00Z')
  `;

  // ── Courses ────────────────────────────────────────────────────────────────
  console.log('🎓  Cursos...');
  const C = {
    ingA1: uuid(), ingA2: uuid(), ingB1: uuid(), ingB2: uuid(),
    aleA1: uuid(), aleA2: uuid(), aleB1: uuid(),
    busEng: uuid(), fonetica: uuid(), convTaller: uuid(),
  };
  await sql`INSERT INTO courses (id, title, description, source, provider_id, url, duration_h, cost_per_user, currency, created_by, created_at) VALUES
    (${C.ingA1},     'Inglés A1 — Fundamentos',         'Vocabulario básico, saludos, números, colores, presente simple. Nivel absoluto inicial.',
                     'internal',${P['Formación Interna']},null,30,0,'ARS',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.ingA2},     'Inglés A2 — Comunicación Básica',  'Pasado simple, vocabulario cotidiano, instrucciones, compras y viajes.',
                     'external',${P['Berlitz Argentina']},'https://berlitz.com/ar/ingles-a2',30,20,'USD',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.ingB1},     'Inglés B1 — Negocios',             'Comunicación profesional, emails, reuniones, presentaciones y negociación.',
                     'external',${P['Cambridge Assessment']},'https://cambridgeenglish.org/b1-business',40,25,'USD',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.ingB2},     'Inglés B2 — Avanzado',             'Redacción formal, debate, gramática compleja, comprensión de textos técnicos.',
                     'external',${P['Cambridge Assessment']},'https://cambridgeenglish.org/b2-advanced',40,28,'USD',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.aleA1},     'Alemán A1 — Grundkurs',            'Alphabet, saludos, presentación personal, números, colores. Estructura básica.',
                     'internal',${P['Formación Interna']},null,30,0,'ARS',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.aleA2},     'Alemán A2 — Kommunikation',        'Conversaciones cotidianas, tiempos verbales básicos, vocabulario del trabajo.',
                     'external',${P['Berlitz Argentina']},'https://berlitz.com/ar/aleman-a2',35,22,'USD',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.aleB1},     'Alemán B1 — Berufssprache',        'Alemán para el trabajo: reuniones, emails, instrucciones técnicas.',
                     'external',${P['Cambridge Assessment']},'https://cambridgeenglish.org/german-b1',40,28,'USD',${UID.a2},'2026-02-01T09:00:00Z'),
    (${C.busEng},    'Business English Writing',          'Redacción de emails, informes y propuestas profesionales en inglés.',
                     'external',${P['Cambridge Assessment']},'https://cambridgeenglish.org/business-writing',15,18,'USD',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.fonetica},  'Pronunciación y Fonética',          'Fonemas del inglés, entonación, ritmo y reducción del acento.',
                     'internal',${P['Formación Interna']},null,10,0,'ARS',${UID.a1},'2026-02-01T09:00:00Z'),
    (${C.convTaller},'Taller de Conversación Avanzada',   'Debates, Role-plays, presentaciones y discusiones sobre temas de actualidad.',
                     'internal',${P['Formación Interna']},null,12,0,'ARS',${UID.a2},'2026-02-01T09:00:00Z')
  `;

  // ── Training Lines ─────────────────────────────────────────────────────────
  console.log('🗂  Líneas de formación...');
  const TL = { ingFastTrack: uuid(), ingAvanzado: uuid(), aleStarter: uuid() };
  await sql`INSERT INTO training_lines (id, title, description, mandatory, created_by, created_at) VALUES
    (${TL.ingFastTrack},'English Fast Track A1→B1',
      'Programa acelerado de inglés para llevar a los participantes de cero a nivel comunicativo profesional.',
      true,${UID.a1},'2026-02-01T09:00:00Z'),
    (${TL.ingAvanzado}, 'English Advanced B2+',
      'Perfeccionamiento para participantes con nivel intermedio que buscan fluidez profesional.',
      false,${UID.a2},'2026-02-01T09:00:00Z'),
    (${TL.aleStarter},  'German Starter A1→A2',
      'Introducción al alemán: bases lingüísticas y comunicación en entornos profesionales.',
      true,${UID.a2},'2026-02-01T09:00:00Z')
  `;
  await sql`INSERT INTO training_line_sectors (training_line_id, sector_id) VALUES
    (${TL.ingFastTrack},${S['Inglés — Inicial A1/A2']}),(${TL.ingFastTrack},${S['Inglés — Intermedio B1']}),
    (${TL.ingAvanzado}, ${S['Inglés — Avanzado B2/C1']}),
    (${TL.aleStarter},  ${S['Alemán — Inicial A1/A2']})
  `;

  const TLI = Array.from({length:10}, uuid);
  await sql`INSERT INTO training_line_items (id, training_line_id, item_type, course_id, evaluation_template_id, task_template_id, order_index) VALUES
    (${TLI[0]},${TL.ingFastTrack},'course',   ${C.ingA1},null,null,      1),
    (${TLI[1]},${TL.ingFastTrack},'task',     null,null,${TT.conv},      2),
    (${TLI[2]},${TL.ingFastTrack},'course',   ${C.ingA2},null,null,      3),
    (${TLI[3]},${TL.ingFastTrack},'evaluation',null,${ET.nivelA2},null,  4),
    (${TLI[4]},${TL.ingFastTrack},'course',   ${C.ingB1},null,null,      5),
    (${TLI[5]},${TL.ingAvanzado}, 'course',   ${C.ingB2},null,null,      1),
    (${TLI[6]},${TL.ingAvanzado}, 'course',   ${C.busEng},null,null,     2),
    (${TLI[7]},${TL.ingAvanzado}, 'course',   ${C.convTaller},null,null, 3),
    (${TLI[8]},${TL.aleStarter},  'course',   ${C.aleA1},null,null,      1),
    (${TLI[9]},${TL.aleStarter},  'course',   ${C.fonetica},null,null,   2)
  `;

  // ── Estado inicial: tareas y evaluaciones pendientes ──────────────────────
  console.log('📋  Estado inicial (pendiente)...');
  const allU = [UID.u1,UID.u2,UID.u3,UID.u4,UID.u5,UID.u6,UID.u7,UID.u8];

  for (const uid of allU) {
    await sql`INSERT INTO tasks (id,template_id,user_id,assigned_by,title,description,status,progress,assigned_date,due_date,created_at)
      VALUES (${uuid()},${TT.conv},${uid},${UID.a1},'Primera Práctica de Conversación','',
        'pending',0,'2026-02-01','2026-02-07','2026-02-01T09:00:00Z')`;
  }
  for (const uid of allU) {
    await sql`INSERT INTO evaluations (id,template_id,user_id,assigned_by,status,assigned_date,due_date,score,max_score,created_at)
      VALUES (${uuid()},${ET.diagnostico},${uid},${UID.a1},'pending','2026-02-01','2026-02-07',null,100,'2026-02-01T10:00:00Z')`;
  }

  // Inscripciones iniciales (0 progreso)
  const lineByUser = [
    [UID.u1, TL.ingFastTrack, 5], [UID.u2, TL.aleStarter, 2],
    [UID.u3, TL.ingFastTrack, 5], [UID.u4, TL.aleStarter, 2],
    [UID.u5, TL.ingFastTrack, 5], [UID.u6, TL.ingFastTrack, 5],
    [UID.u7, TL.ingFastTrack, 5], [UID.u8, TL.ingFastTrack, 5],
  ];
  for (const [uid, tlId, total] of lineByUser) {
    await sql`INSERT INTO training_line_progress (user_id,training_line_id,total_items,completed_items,last_updated)
      VALUES (${uid},${tlId},${total},0,'2026-02-01T09:00:00Z') ON CONFLICT (user_id,training_line_id) DO NOTHING`;
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

  console.log('\n✅  idiomas-01-base completado — Estado: Día 1\n');
  console.log('📊  Registros:', JSON.stringify(c, null, 2));
  console.log('\n🔑  Contraseña: Teams2026!');
  console.log('   Admins: emlopezgonzalez@gmail.com | mschulz@linguaforward.com');
  console.log('   Users:  pablo.m90 | carla.m90 | javier.m70 | sofia.m70 |');
  console.log('           diego.m50 | ana.m30 | nicolas.sm | laura.rg  @linguaforward.com');
  console.log('\n▶  Siguiente: node seeds/idiomas-02-progresion.mjs');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
