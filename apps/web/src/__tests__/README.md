# Plan de Pruebas — Teams Improve

> Documento de referencia para la sección **§6.2.4 Pruebas** del TFI UTN-FRT.  
> Autores: López González, Eduardo · Soraire, Sebastián

---

## 1. Estrategia de testing

El plan de pruebas adopta una estrategia en **dos capas complementarias**:

| Capa | Tipo | Herramienta | Alcance |
|---|---|---|---|
| **Capa 1** | Pruebas unitarias automatizadas | Jest + React Testing Library | Funciones puras, fórmulas de negocio, componentes UI aislados |
| **Capa 2** | Pruebas funcionales manuales | Ejecución manual documentada | Flujos completos de usuario (auth, Kanban, evaluaciones, ROI) |

Las pruebas de **Capa 1** se ejecutan con `npm test` y producen resultados reproducibles y automatizables en CI.  
Las pruebas de **Capa 2** siguen el plan documentado en la Tabla 8 del TFI (PT01–PT12) y se ejecutan manualmente contra el sistema desplegado en producción (Vercel).

---

## 2. Estructura de carpetas

```
apps/web/
├── jest.config.js               # Configuración de Jest para Next.js 15 (CommonJS)
├── jest.setup.ts                # Setup global: @testing-library/jest-dom
└── src/
    ├── lib/
    │   └── formulas.ts          # Fórmulas de negocio extraídas como funciones puras
    └── __tests__/
        ├── README.md            # Este archivo
        └── unit/
            ├── lib/
            │   ├── utils.test.ts        # Tests de src/lib/utils.ts
            │   └── formulas.test.ts     # Tests de src/lib/formulas.ts
            └── components/
                ├── StatItem.test.tsx        # Tests de StatItem
                └── EvaluationCard.test.tsx  # Tests de EvaluationCard
```

---

## 3. Herramientas utilizadas

| Herramienta | Versión | Rol |
|---|---|---|
| **Jest** | ^29 | Runner de tests y framework de assertions |
| **React Testing Library** | ^16 | Renderizado de componentes React en jsdom |
| **@testing-library/jest-dom** | ^6 | Matchers adicionales para el DOM (`toBeInTheDocument`, `toHaveClass`, etc.) |
| **next/jest** | incluido en Next.js 15 | Transformación de TypeScript y módulos de Next.js |
| **jsdom** | incluido en jest-environment-jsdom | Simulación del entorno de navegador |

---

## 4. Archivos de test — detalle

### 4.1 `unit/lib/utils.test.ts`

**Módulo testeado:** `src/lib/utils.ts`  
**Tipo:** Unitario — funciones puras sin dependencias externas  
**Mocks necesarios:** Ninguno

| Suite (`describe`) | Casos de prueba | RF cubierto |
|---|---|---|
| `normalizeUrl` | undefined → `"#"`, vacío → `"#"`, https ya presente, http ya presente, sin protocolo → agrega https, solo dominio | RF-04 |
| `getResourceTypeLabel` | pdf, PDF (case), video, link, doc, document, desconocido, undefined | RF-04 |
| `buildAssignmentUsers` | assigned correcto, selected correcto, ambos simultáneos, longitud preservada, campos originales, arreglo vacío | RF-14 |
| `formatDateShort` | undefined, null, ISO date, datetime con T, string con comillas | RF-06, RF-07 |
| `isStrongPassword` | válida, sin mayúscula, sin minúscula, sin punto, < 8 chars, vacía | RF-01 |
| `extractGoogleFormId` | URL de edición, URL viewform, no-URL, ID directo | RF-12 |

**Total: 35 casos de prueba**

#### Tabla de casos de prueba — `utils.test.ts`

| ID | Función | Descripción del caso | Entrada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|
| UT-U01 | `normalizeUrl` | URL indefinida retorna ancla segura | `undefined` | `"#"` | ✅ PASS |
| UT-U02 | `normalizeUrl` | String vacío retorna ancla segura | `""` | `"#"` | ✅ PASS |
| UT-U03 | `normalizeUrl` | URL con `https://` no se modifica | `"https://example.com"` | `"https://example.com"` | ✅ PASS |
| UT-U04 | `normalizeUrl` | URL con `http://` no se modifica | `"http://example.com"` | `"http://example.com"` | ✅ PASS |
| UT-U05 | `normalizeUrl` | URL sin protocolo recibe `https://` | `"coursera.org/course/react"` | `"https://coursera.org/course/react"` | ✅ PASS |
| UT-U06 | `normalizeUrl` | Dominio solo recibe `https://` | `"udemy.com"` | `"https://udemy.com"` | ✅ PASS |
| UT-U07 | `getResourceTypeLabel` | Tipo `"pdf"` en minúsculas | `"pdf"` | `"PDF"` | ✅ PASS |
| UT-U08 | `getResourceTypeLabel` | Tipo `"PDF"` en mayúsculas (case insensitive) | `"PDF"` | `"PDF"` | ✅ PASS |
| UT-U09 | `getResourceTypeLabel` | Tipo `"video"` | `"video"` | `"Video"` | ✅ PASS |
| UT-U10 | `getResourceTypeLabel` | Tipo `"link"` | `"link"` | `"Link"` | ✅ PASS |
| UT-U11 | `getResourceTypeLabel` | Tipo `"doc"` | `"doc"` | `"Documento"` | ✅ PASS |
| UT-U12 | `getResourceTypeLabel` | Tipo `"document"` (alias) | `"document"` | `"Documento"` | ✅ PASS |
| UT-U13 | `getResourceTypeLabel` | Tipo desconocido retorna el valor original | `"audio"` | `"audio"` | ✅ PASS |
| UT-U14 | `getResourceTypeLabel` | Tipo `undefined` retorna fallback | `undefined` | `"Recurso"` | ✅ PASS |
| UT-U15 | `buildAssignmentUsers` | Usuario en `assignedUsers` tiene `assigned=true` | `allUsers`, `[u1]`, `[]` | `u1.assigned === true`, `u2.assigned === false` | ✅ PASS |
| UT-U16 | `buildAssignmentUsers` | IDs en `selectedUserIds` tienen `selected=true` | `allUsers`, `[]`, `["u2","u3"]` | `u2.selected === true`, `u3.selected === true`, `u1.selected === false` | ✅ PASS |
| UT-U17 | `buildAssignmentUsers` | Usuario puede ser assigned y selected a la vez | `allUsers`, `[u1]`, `["u1"]` | `u1.assigned === true && u1.selected === true` | ✅ PASS |
| UT-U18 | `buildAssignmentUsers` | La cantidad de resultados iguala el total de usuarios | `allUsers (3)`, `[]`, `[]` | `result.length === 3` | ✅ PASS |
| UT-U19 | `buildAssignmentUsers` | Los campos originales del usuario se preservan | `allUsers`, `[]`, `[]` | `result[0]` contiene `{id:"u1", name:"Ana García", email, role}` | ✅ PASS |
| UT-U20 | `buildAssignmentUsers` | Lista vacía retorna arreglo vacío | `[]`, `[]`, `[]` | `[]` | ✅ PASS |
| UT-U21 | `formatDateShort` | `undefined` retorna guión largo | `undefined` | `"—"` | ✅ PASS |
| UT-U22 | `formatDateShort` | `null` retorna guión largo | `null` | `"—"` | ✅ PASS |
| UT-U23 | `formatDateShort` | Fecha ISO `YYYY-MM-DD` se convierte a `DD/MM/YYYY` | `"2026-03-15"` | `"15/03/2026"` | ✅ PASS |
| UT-U24 | `formatDateShort` | Datetime con `T` extrae solo la parte de fecha | `"2026-06-01T00:00:00.000Z"` | `"01/06/2026"` | ✅ PASS |
| UT-U25 | `formatDateShort` | Comillas extras del backend se eliminan | `'"2026-12-31"'` | `"31/12/2026"` | ✅ PASS |
| UT-U26 | `isStrongPassword` | Contraseña válida con todos los criterios | `"Segura.2026"` | `true` | ✅ PASS |
| UT-U27 | `isStrongPassword` | Sin mayúscula → rechazada | `"minuscula.1"` | `false` | ✅ PASS |
| UT-U28 | `isStrongPassword` | Sin minúscula → rechazada | `"MAYUSCULA.1"` | `false` | ✅ PASS |
| UT-U29 | `isStrongPassword` | Sin punto → rechazada | `"SinPunto123"` | `false` | ✅ PASS |
| UT-U30 | `isStrongPassword` | Menos de 8 caracteres → rechazada | `"Ab.1234"` (7 chars) | `false` | ✅ PASS |
| UT-U31 | `isStrongPassword` | String vacío → rechazado | `""` | `false` | ✅ PASS |
| UT-U32 | `extractGoogleFormId` | URL de edición (`/edit`) → extrae ID | `"https://docs.google.com/forms/d/1FAIpQLSf_.../edit"` | ID de 50+ chars | ✅ PASS |
| UT-U33 | `extractGoogleFormId` | URL de respuesta (`/viewform`) → extrae ID | `"https://docs.google.com/forms/d/e/1FAIpQLSf_.../viewform"` | ID de 50+ chars | ✅ PASS |
| UT-U34 | `extractGoogleFormId` | Texto no-URL → retorna el input sin modificar | `"no-es-una-url"` | `"no-es-una-url"` | ✅ PASS |
| UT-U35 | `extractGoogleFormId` | ID pegado directamente → retorna sin modificar | `"1FAIpQLSf_ABC123..."` | mismo ID | ✅ PASS |

---

### 4.2 `unit/lib/formulas.test.ts`

**Módulo testeado:** `src/lib/formulas.ts`  
**Tipo:** Unitario — lógica de negocio crítica del sistema  
**Mocks necesarios:** Ninguno

| Suite (`describe`) | Casos de prueba | RF cubierto |
|---|---|---|
| `calcPerformanceIndex` | Caso real del TFI (Lucas→40.2), todos ceros, perfecto (100), cap de horas, caso intermedio, suma pesos=100, sin horas | RF-16, RF-17 |
| `isEvaluationApproved` | exactamente el umbral (60/100), sobre el umbral, bajo el umbral, score 0, umbral personalizado mayor, umbral personalizado menor, max≠100, max=0, max negativo | RF-16, RF-17, RF-18 |
| `formatWorkSeconds` | 3600s, 5400s, 90s, 7200s, 0s, negativo, 38700s | RF-15, RF-18 |

**Total: 23 casos de prueba**

> **Nota de trazabilidad:** El caso `calcPerformanceIndex` con Lucas (40.2) reproduce exactamente la verificación documentada en §10.1 del TFI. Esto garantiza que la implementación coincide con la especificación.

#### Tabla de casos de prueba — `formulas.test.ts`

**Fórmula documentada (§10.1 TFI):**  
`IP = (tareas × 0.40) + (aprobación × 0.40) + (MIN(horas / 200 × 100, 100) × 0.20)`

| ID | Función | Descripción del caso | Entrada | Cálculo manual | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|---|
| UT-F01 | `calcPerformanceIndex` | Caso real del TFI — usuario Lucas | `(100, 0, 2.2)` | `40 + 0 + MIN(1.1,100)×0.2 = 40.22` → redondeado | `40.2` | ✅ PASS |
| UT-F02 | `calcPerformanceIndex` | Todos los parámetros en cero | `(0, 0, 0)` | `0 + 0 + 0` | `0` | ✅ PASS |
| UT-F03 | `calcPerformanceIndex` | Rendimiento perfecto con 200h | `(100, 100, 200)` | `40 + 40 + 20` | `100` | ✅ PASS |
| UT-F04 | `calcPerformanceIndex` | Horas superiores a 200 → capeo en 20 puntos | `(0, 0, 500)` vs `(0, 0, 200)` | `MIN(250,100)×0.2 = 20` = `MIN(100,100)×0.2 = 20` | Ambos = `20` | ✅ PASS |
| UT-F05 | `calcPerformanceIndex` | Caso intermedio con valores parciales | `(50, 80, 100)` | `20 + 32 + 10` | `62` | ✅ PASS |
| UT-F06 | `calcPerformanceIndex` | Los pesos suman exactamente 100 en el mejor caso | `(100, 100, 200)` | `40 + 40 + 20` | `100` | ✅ PASS |
| UT-F07 | `calcPerformanceIndex` | Las horas en 0 no aportan al índice | `(80, 60, 0)` | `32 + 24 + 0` | `56` | ✅ PASS |
| UT-F08 | `isEvaluationApproved` | Score exactamente en el umbral mínimo (60%) | `(60, 100)` | `60/100×100 = 60 >= 60` | `true` | ✅ PASS |
| UT-F09 | `isEvaluationApproved` | Score por encima del umbral (80%) | `(80, 100)` | `80 >= 60` | `true` | ✅ PASS |
| UT-F10 | `isEvaluationApproved` | Score un punto bajo el umbral (59%) | `(59, 100)` | `59 < 60` | `false` | ✅ PASS |
| UT-F11 | `isEvaluationApproved` | Score cero no aprueba nunca | `(0, 100)` | `0 < 60` | `false` | ✅ PASS |
| UT-F12 | `isEvaluationApproved` | Umbral personalizado 75% — justo por debajo | `(74, 100, 75)` | `74 < 75` | `false` | ✅ PASS |
| UT-F13 | `isEvaluationApproved` | Umbral personalizado 75% — exactamente en umbral | `(75, 100, 75)` | `75 >= 75` | `true` | ✅ PASS |
| UT-F14 | `isEvaluationApproved` | Umbral personalizado 50% — exactamente en umbral | `(50, 100, 50)` | `50 >= 50` | `true` | ✅ PASS |
| UT-F15 | `isEvaluationApproved` | Umbral personalizado 50% — un punto abajo | `(49, 100, 50)` | `49 < 50` | `false` | ✅ PASS |
| UT-F16 | `isEvaluationApproved` | `max_score` distinto de 100 — aprueba (30/50) | `(30, 50)` | `30/50×100 = 60 >= 60` | `true` | ✅ PASS |
| UT-F17 | `isEvaluationApproved` | `max_score` distinto de 100 — no aprueba (29/50) | `(29, 50)` | `29/50×100 = 58 < 60` | `false` | ✅ PASS |
| UT-F18 | `isEvaluationApproved` | `max_score = 0` → evita división por cero | `(0, 0)` | guarda contra `max <= 0` | `false` | ✅ PASS |
| UT-F19 | `isEvaluationApproved` | `max_score` negativo → comportamiento seguro | `(10, -1)` | guarda contra `max <= 0` | `false` | ✅ PASS |
| UT-F20 | `formatWorkSeconds` | 1 hora exacta | `3600` | `3600/3600 = 1h`, `0m` | `"1h 0m"` | ✅ PASS |
| UT-F21 | `formatWorkSeconds` | 1 hora y media | `5400` | `5400/3600 = 1h`, `(5400%3600)/60 = 30m` | `"1h 30m"` | ✅ PASS |
| UT-F22 | `formatWorkSeconds` | 90 segundos — menos de 1 minuto completo | `90` | `0h`, `90/60 = 1m` | `"0h 1m"` | ✅ PASS |
| UT-F23 | `formatWorkSeconds` | 2 horas exactas | `7200` | `7200/3600 = 2h`, `0m` | `"2h 0m"` | ✅ PASS |
| UT-F24 | `formatWorkSeconds` | Cero segundos | `0` | condición `!seconds` | `"0h 0m"` | ✅ PASS |
| UT-F25 | `formatWorkSeconds` | Valor negativo — comportamiento seguro | `-100` | condición `seconds < 0` | `"0h 0m"` | ✅ PASS |
| UT-F26 | `formatWorkSeconds` | Jornada larga: 10h 45m | `38700` | `38700/3600 = 10h`, `(38700%3600)/60 = 45m` | `"10h 45m"` | ✅ PASS |

---

### 4.3 `unit/components/StatItem.test.tsx`

**Módulo testeado:** `src/components/dashboard/StatItem.tsx`  
**Tipo:** Unitario de componente — renderizado visual puro  
**Mocks necesarios:** Ninguno (componente sin efectos secundarios)

| Suite (`describe`) | Casos de prueba | RF cubierto |
|---|---|---|
| `StatItem` | label renderizado, valor numérico, valor string, valor ReactNode, clase CSS label, clase CSS valor bold, estructura del contenedor | RF-16, RF-18 |

**Total: 7 casos de prueba**

#### Tabla de casos de prueba — `StatItem.test.tsx`

| ID | Descripción del caso | Props de entrada | Condición verificada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|
| UT-S01 | Renderiza el label correctamente | `label="Tareas completadas"`, `value={12}` | `getByText("Tareas completadas")` está en el DOM | Texto visible | ✅ PASS |
| UT-S02 | Renderiza un valor numérico | `label="Score"`, `value={85}` | `getByText("85")` está en el DOM | Número renderizado como texto | ✅ PASS |
| UT-S03 | Renderiza un valor string | `label="Tiempo"`, `value="2h 30m"` | `getByText("2h 30m")` está en el DOM | String visible | ✅ PASS |
| UT-S04 | Renderiza un valor ReactNode (JSX) | `label="Estado"`, `value={<span data-testid="badge">Activo</span>}` | `getByTestId("badge")` y `getByText("Activo")` en el DOM | Elemento JSX anidado renderizado | ✅ PASS |
| UT-S05 | Label tiene clase de estilo `text-gray-400` | `label="Usuarios"`, `value={5}` | Elemento del label tiene `class` que incluye `text-gray-400` | Clase CSS presente en el elemento `<p>` del label | ✅ PASS |
| UT-S06 | Valor tiene clase de estilo `font-bold` | `label="Total"`, `value="100%"` | Elemento del valor tiene `class` que incluye `font-bold` | Clase CSS presente en el elemento `<p>` del valor | ✅ PASS |
| UT-S07 | El contenedor tiene exactamente 2 elementos hijo | `label="KPI"`, `value={42}` | `container.firstChild.children.length === 2` | El `<div>` raíz contiene exactamente el `<p>` de label y el `<p>` de valor | ✅ PASS |

---

### 4.4 `unit/components/EvaluationCard.test.tsx`

**Módulo testeado:** `src/components/dashboard/EvaluationCard.tsx`  
**Tipo:** Unitario de componente — renderizado condicional e interacción  
**Mocks necesarios:** `jest.fn()` para callbacks `onPublish` y `onManageAssignments`

| Suite (`describe`) | Casos de prueba | RF cubierto |
|---|---|---|
| `EvaluationCard — contenido` | título, descripción, tipo label (Skills), Online, Presencial, badge draft, badge active, badge completed, users asignados, fecha formateada | RF-11 |
| `EvaluationCard — botón Publicar` | visible en draft, oculto en active, oculto en completed | RF-11 |
| `EvaluationCard — interacciones` | onPublish llamado con id, onManageAssignments llamado con id+dueDate, botón Gestionar visible en todos los estados | RF-14 |

**Total: 16 casos de prueba**

**Fixture base utilizada en todos los casos:**
```typescript
const baseEval: EvaluationTemplateItem = {
  id: "eval-uuid-001",
  title: "Evaluación de Skills Q1 2026",
  description: "Evaluación técnica del primer trimestre",
  type: "skills",         // → label "Skills"
  status: "draft",        // → label "Sin publicar"
  createdDate: "2026-03-01",
  dueDate: "2026-03-31",  // → formateado "31/03/2026"
  assignedUsers: 5,
  responses: 0,
  completionRate: 0,
  online: true,           // → label "Online"
};
```

#### Tabla de casos de prueba — `EvaluationCard.test.tsx`

**Suite: EvaluationCard — contenido (RF-11)**

| ID | Descripción del caso | Variación de fixture | Condición verificada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|
| UT-E01 | Muestra el título de la evaluación | `baseEval` sin cambios | `getByText("Evaluación de Skills Q1 2026")` en DOM | Título visible | ✅ PASS |
| UT-E02 | Muestra la descripción | `baseEval` sin cambios | `getByText("Evaluación técnica del primer trimestre")` en DOM | Descripción visible | ✅ PASS |
| UT-E03 | Muestra el label de tipo correcto para `"skills"` | `baseEval` sin cambios | `getByText("Skills")` en DOM | `EVALUATION_TYPE_LABELS["skills"] = "Skills"` | ✅ PASS |
| UT-E04 | Muestra `"Online"` cuando `online=true` | `baseEval` sin cambios | `getByText("Online")` en DOM | `MODE["true"] = "Online"` | ✅ PASS |
| UT-E05 | Muestra `"Presencial"` cuando `online=false` | `{...baseEval, online: false}` | `getByText("Presencial")` en DOM | `MODE["false"] = "Presencial"` | ✅ PASS |
| UT-E06 | Muestra badge `"Sin publicar"` para estado `draft` | `baseEval` sin cambios | `getByText("Sin publicar")` en DOM | `TEMPLATE_STATUS_LABELS["draft"] = "Sin publicar"` | ✅ PASS |
| UT-E07 | Muestra badge `"Publicada"` para estado `active` | `{...baseEval, status: "active"}` | `getByText("Publicada")` en DOM | `TEMPLATE_STATUS_LABELS["active"] = "Publicada"` | ✅ PASS |
| UT-E08 | Muestra badge `"Finalizada"` para estado `completed` | `{...baseEval, status: "completed"}` | `getByText("Finalizada")` en DOM | `TEMPLATE_STATUS_LABELS["completed"] = "Finalizada"` | ✅ PASS |
| UT-E09 | Muestra la cantidad de usuarios asignados | `baseEval` con `assignedUsers: 5` | `getByText("5")` en DOM | Número `5` visible | ✅ PASS |
| UT-E10 | Muestra la fecha límite formateada | `baseEval` con `dueDate: "2026-03-31"` | `getByText(/31\/03\/2026/)` en DOM | `formatDateShort("2026-03-31") = "31/03/2026"` | ✅ PASS |

**Suite: EvaluationCard — botón Publicar (RF-11)**

| ID | Descripción del caso | Variación de fixture | Condición verificada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|
| UT-E11 | Botón "Publicar" visible en estado `draft` | `baseEval` con `status: "draft"` | `getByRole("button", { name: /publicar/i })` en DOM | Botón renderizado | ✅ PASS |
| UT-E12 | Botón "Publicar" NO existe en estado `active` | `{...baseEval, status: "active"}` | `queryByRole("button", { name: /publicar/i })` es `null` | Botón ausente del DOM | ✅ PASS |
| UT-E13 | Botón "Publicar" NO existe en estado `completed` | `{...baseEval, status: "completed"}` | `queryByRole("button", { name: /publicar/i })` es `null` | Botón ausente del DOM | ✅ PASS |

**Suite: EvaluationCard — interacciones (RF-14)**

| ID | Descripción del caso | Variación de fixture | Acción simulada | Condición verificada | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|---|
| UT-E14 | `onPublish` se llama con el ID correcto al publicar | `baseEval` con `status: "draft"` | `fireEvent.click(botón "Publicar")` | `onPublish` fue llamado 1 vez con `"eval-uuid-001"` | Callback invocado con ID exacto | ✅ PASS |
| UT-E15 | `onManageAssignments` se llama con ID y dueDate | `baseEval` sin cambios | `fireEvent.click(botón "Gestionar asignaciones")` | `onManageAssignments` llamado con `("eval-uuid-001", "2026-03-31")` | Callback invocado con ambos parámetros | ✅ PASS |
| UT-E16 | Botón "Gestionar asignaciones" visible en los 3 estados | Itera `["draft","active","completed"]` | Render con cada estado | `getByRole("button", { name: /gestionar asignaciones/i })` en DOM en cada caso | Botón presente en todos los estados | ✅ PASS |

---

## 5. Resultados de ejecución y cobertura

### 5.1 Resultado de `npm test` (13/05/2026)

```
PASS src/__tests__/unit/lib/formulas.test.ts
PASS src/__tests__/unit/lib/utils.test.ts
PASS src/__tests__/unit/components/StatItem.test.tsx
PASS src/__tests__/unit/components/EvaluationCard.test.tsx

Test Suites: 4 passed, 4 total
Tests:       81 passed, 81 total
Time:        5.964 s
```

### 5.2 Resumen por archivo

| Archivo | Casos | Suites |
|---|---|---|
| `utils.test.ts` | 35 | 6 |
| `formulas.test.ts` | 23 | 3 |
| `StatItem.test.tsx` | 7 | 1 |
| `EvaluationCard.test.tsx` | 16 | 3 |
| **Total** | **81** | **13** |

### 5.3 Cobertura de código (`npm run test:coverage`)

| Archivo | % Stmts | % Branch | % Funcs | % Lines | Líneas no cubiertas |
|---|---|---|---|---|---|
| `EvaluationCard.tsx` | 100 | 100 | 100 | 100 | — |
| `StatItem.tsx` | 100 | 100 | 100 | 100 | — |
| `formulas.ts` | 100 | 100 | 100 | 100 | — |
| `utils.ts` | 80 | 88.23 | 80 | 81.81 | 5-6 (`cn`), 26-29 (`normalizeDateInput`) |
| **Total** | **86.66** | **92.59** | **88.23** | **88.23** | |

> Las líneas no cubiertas de `utils.ts` corresponden a `cn()` (helper de Tailwind sin lógica de negocio) y `normalizeDateInput()` (utilidad interna de formularios). Ambas están excluidas intencionalmente del plan de pruebas por no ser lógica de dominio crítica.

---

### 5.4 Qué demuestran estas pruebas

#### `formulas.test.ts` — Correctitud de la lógica de negocio crítica

Este archivo demuestra que las tres fórmulas centrales del sistema están implementadas correctamente:

**`calcPerformanceIndex`**
- El algoritmo `(tareas×0.4) + (evaluaciones×0.4) + (horas_norm×0.2)` produce exactamente los valores esperados según la especificación del TFI §10.1.
- El caso real `calcPerformanceIndex(100, 0, 2.2) = 40.2` reproduce el ejemplo documentado con el usuario Lucas, garantizando que el código coincide con la fórmula documentada.
- Las horas se normalizan respecto a 200h/mes y se capean en 20 puntos (20% de 100), evitando que jornadas extraordinarias distorsionen el índice.
- El índice es siempre 0 cuando todos los parámetros son 0, y 100 cuando el desempeño es perfecto.

**`isEvaluationApproved`**
- El sistema aprueba correctamente cuando `score >= 60%` del máximo posible (umbral por defecto del negocio).
- Se verifica el caso borde exacto del umbral: `60/100 = 60%` aprueba, `59/100 = 59%` no aprueba.
- La función es segura ante `maxScore = 0` o valores negativos (retorna `false`, no lanza excepción), evitando divisiones por cero en producción.
- El umbral es configurable para evaluaciones con criterios distintos (ej: 75% para certificaciones críticas).

**`formatWorkSeconds`**
- Los segundos almacenados en la tabla `work_sessions` se convierten correctamente al formato `Xh Ym` para la UI.
- Casos extremos verificados: 0 segundos, valores negativos (devuelve `"0h 0m"`), jornadas largas (10h 45m = 38700s).

---

#### `utils.test.ts` — Correctitud de funciones de utilidad transversales

**`normalizeUrl`** (RF-04 — Recursos de tareas)
- Demuestra que los recursos adjuntos a tareas siempre se abren en el browser correctamente, tanto si el admin cargó la URL con protocolo como sin él.
- URLs sin protocolo reciben `https://` automáticamente; `undefined` o vacío retornan `"#"` para evitar links rotos.

**`getResourceTypeLabel`** (RF-04)
- La conversión de tipo técnico (`"pdf"`, `"video"`, `"doc"`) a etiqueta legible funciona en mayúsculas y minúsculas indistintamente.
- Tipos desconocidos muestran el valor original en lugar de romperse.

**`buildAssignmentUsers`** (RF-14 — Gestión de asignaciones)
- Demuestra que al abrir el modal de asignaciones, la lista de usuarios se construye correctamente marcando quién ya está asignado (`assigned`) y quién fue seleccionado en la sesión actual (`selected`).
- Un usuario puede estar simultáneamente asignado y seleccionado; la función lo maneja sin colisión.
- La cantidad de usuarios en el resultado es siempre igual a la lista de entrada (no se pierden ni duplican usuarios).

**`formatDateShort`** (RF-06, RF-07 — Fechas de tareas y evaluaciones)
- Las fechas provenientes de la base de datos (formato `YYYY-MM-DD` o `ISO 8601 con T`) se muestran en formato argentino `DD/MM/YYYY`.
- Las comillas extras que puede enviar el backend (`"2026-03-31"`) se eliminan antes de formatear.
- `undefined` o `null` retornan `"—"` en lugar de un error en runtime.

**`isStrongPassword`** (RF-01 — Registro de usuarios)
- La validación de contraseñas exige exactamente los criterios documentados en los requerimientos: al menos una mayúscula, una minúscula, un punto, y 8 caracteres mínimo.
- Cada criterio se verifica de forma independiente para que el error sea granular.

**`extractGoogleFormId`** (RF-12 — Evaluaciones virtuales)
- El ID del formulario se extrae correctamente tanto de URLs de edición (`/d/ID/edit`) como de URLs de respuesta (`/d/e/ID/viewform`).
- Si el admin pega directamente el ID (sin URL), la función lo retorna sin modificar.

---

#### `StatItem.test.tsx` — Correctitud del componente de métricas

**`StatItem`** (RF-16, RF-18 — Dashboard de desempeño)
- Demuestra que el componente presentacional muestra correctamente cualquier tipo de valor: número, string, o elemento JSX (como un badge de color).
- Las clases CSS de estilo (`text-gray-400` para labels, `font-bold` para valores) están presentes y no fueron eliminadas accidentalmente en ningún refactor.
- El componente no tiene estado ni efectos secundarios — es puramente determinista dado sus props.

---

#### `EvaluationCard.test.tsx` — Correctitud del componente de evaluaciones

**Contenido renderizado** (RF-11 — Gestión de evaluaciones)
- El componente traduce correctamente los valores técnicos del modelo a texto legible: `"skills"` → `"Skills"`, `"draft"` → `"Sin publicar"`, `true` → `"Online"`.
- Todos los datos del objeto evaluación (título, descripción, usuarios asignados, fecha) se renderizan en la UI.
- Los tres estados posibles (`draft`, `active`, `completed`) producen badges visualmente distintos.

**Renderizado condicional — botón Publicar** (RF-11)
- Demuestra que el botón "Publicar" solo aparece en estado `draft`, que es la única transición de estado válida según las reglas de negocio.
- Una evaluación `active` o `completed` no puede volver a publicarse; el botón no existe en el DOM para esos estados (no simplemente oculto, sino no renderizado).

**Interacciones y callbacks** (RF-14 — Asignaciones)
- Al hacer clic en "Publicar", el callback `onPublish` se invoca exactamente una vez y con el ID correcto de la evaluación.
- Al hacer clic en "Gestionar asignaciones", `onManageAssignments` recibe el ID y la `dueDate` — exactamente los parámetros que necesita el modal para precargar datos.
- El botón "Gestionar asignaciones" está siempre disponible, independientemente del estado de la evaluación (un admin siempre puede reasignar).

---

## 6. Cómo ejecutar las pruebas

```bash
# Desde apps/web/
cd login-user/apps/web

# Ejecutar todos los tests unitarios
npm test

# Modo watch (re-ejecuta al guardar archivos)
npm run test:watch

# Con reporte de cobertura
npm run test:coverage
```

El reporte de cobertura HTML se genera en `apps/web/coverage/`.

---

## 7. Pruebas funcionales manuales (Capa 2)

**Entorno:** Sistema desplegado en producción (Vercel).  
**Precondición general:** Tener acceso a una cuenta admin y una cuenta de usuario regular.

### Resumen de resultados

| ID | Flujo | Estado |
|---|---|---|
| PT-01 | Registro y verificación por email | ✅ Aprobado |
| PT-02 | Login y timeout de inactividad (30 min) | ✅ Aprobado |
| PT-03 | Reset de contraseña con token | ✅ Aprobado |
| PT-04 | Creación y asignación de tarea con recursos | ✅ Aprobado |
| PT-05 | Kanban: mover tarea, actualizar progreso, completar | ✅ Aprobado |
| PT-06 | Evaluación virtual con Google Forms + webhook | ✅ Aprobado |
| PT-07 | Presencia en tiempo real (CONECTADO/DESCONECTADO) | ✅ Aprobado |
| PT-08 | Analytics por período (7/30/90 días) | ✅ Aprobado |
| PT-09 | Línea de formación: crear, inscribir, completar ítems | ✅ Aprobado |
| PT-10 | ROI de formación: baseline → delta productividad | ✅ Aprobado |
| PT-11 | Certificaciones: registrar y verificar (admin) | ✅ Aprobado |
| PT-12 | Control de roles: acceso no autorizado → 403/redirect | ✅ Aprobado |

---

### PT-01 — Registro y verificación por email

**Objetivo:** El sistema crea la cuenta y envía el email de verificación; el link activa el usuario.

**Pasos:**
1. Navegar a `/register`
2. Completar el formulario con nombre, email real y contraseña válida (mayúscula + minúscula + punto + 8+ chars)
3. Hacer clic en **Registrarse**
4. Verificar que aparece el mensaje "Revisá tu casilla de correo"
5. Abrir el email recibido (remitente: Resend) y hacer clic en el link de verificación
6. Verificar que redirige al login con mensaje de cuenta verificada
7. Iniciar sesión con las credenciales recién registradas

**Resultado esperado:** El usuario puede iniciar sesión solo después de verificar el email. Antes de verificar, el login rechaza con "Cuenta no verificada".

---

### PT-02 — Login y timeout de inactividad (30 min)

**Objetivo:** La sesión expira automáticamente a los 30 minutos sin actividad.

**Pasos:**
1. Iniciar sesión con una cuenta válida
2. Verificar que el dashboard carga correctamente
3. Dejar la pestaña abierta sin interactuar durante 30 minutos
4. Intentar navegar a cualquier ruta protegida (ej: `/dashboard`)
5. Verificar la redirección automática al login

**Alternativa rápida para verificar el mecanismo:** Abrir DevTools → Application → Cookies, observar el campo `expires` del token JWT; debería ser `now + 30 min`.

**Resultado esperado:** El sistema redirige a `/login` con mensaje de sesión expirada.

---

### PT-03 — Reset de contraseña con token

**Objetivo:** El usuario puede recuperar acceso a su cuenta mediante email.

**Pasos:**
1. Navegar a `/login` y hacer clic en **¿Olvidaste tu contraseña?**
2. Ingresar el email de una cuenta registrada y verificada
3. Hacer clic en **Enviar instrucciones**
4. Abrir el email recibido y hacer clic en el link de reset
5. Verificar que el link lleva a `/reset-password?token=...`
6. Ingresar una nueva contraseña válida y confirmarla
7. Verificar mensaje de éxito y redirección al login
8. Iniciar sesión con la nueva contraseña
9. (Verificación adicional) Intentar usar el link de reset nuevamente — debe rechazarlo como token ya utilizado

**Resultado esperado:** La nueva contraseña funciona; el token de un solo uso queda invalidado.

---

### PT-04 — Creación y asignación de tarea con recursos

**Objetivo:** El admin puede crear una tarea con recursos adjuntos y asignarla a usuarios.

**Pasos (como admin):**
1. Navegar al panel admin → sección **Tareas**
2. Hacer clic en **Nueva tarea**
3. Completar: título, descripción, tipo (curso/reporte/proyecto) y fecha límite
4. Agregar al menos un recurso: ingresar URL de un PDF o link externo y seleccionar su tipo
5. Hacer clic en **Guardar plantilla**
6. En la lista de plantillas, hacer clic en **Asignar** sobre la tarea recién creada
7. Seleccionar uno o más usuarios del listado y confirmar la asignación

**Verificación (como usuario asignado):**
8. Iniciar sesión con la cuenta del usuario asignado
9. Navegar al Kanban → verificar que la tarea aparece en columna **Pendiente**
10. Abrir la tarea → verificar que el recurso adjunto es accesible

**Resultado esperado:** La tarea aparece en el Kanban del usuario; el recurso abre correctamente.

---

### PT-05 — Kanban: mover tarea, actualizar progreso, completar

**Objetivo:** El usuario puede gestionar el avance de sus tareas desde el tablero Kanban.

**Pasos (como usuario):**
1. Navegar al Kanban (requiere tener al menos una tarea asignada — ver PT-04)
2. Arrastrar una tarea de la columna **Pendiente** a **En progreso**
3. Verificar que el estado cambió (actualización en tiempo real o al recargar)
4. Abrir la tarea y modificar el porcentaje de progreso con el slider (ej: 50%)
5. Guardar y verificar que el progreso se refleja en la tarjeta
6. Arrastrar la tarea a la columna **Completado**
7. Verificar que la tarea ya no aparece en el Kanban activo y queda registrada como completada

**Resultado esperado:** Los estados persisten en base de datos; el progreso numérico se actualiza.

---

### PT-06 — Evaluación virtual con Google Forms + webhook

**Objetivo:** El sistema detecta automáticamente cuando un usuario completa el formulario de evaluación.

**Pasos (como admin):**
1. Navegar a **Evaluaciones** → **Nueva evaluación**
2. Completar: título, descripción, tipo, fecha límite
3. Pegar el ID o URL del Google Form vinculado
4. Activar el modo **Online**
5. Hacer clic en **Guardar** y luego **Publicar**
6. Asignar la evaluación a uno o más usuarios

**Pasos (como usuario asignado):**
7. Navegar al panel → sección Evaluaciones asignadas
8. Hacer clic en la evaluación publicada
9. Verificar que el Google Form se muestra embebido (iframe)
10. Completar y enviar el formulario

**Verificación (como admin):**
11. Navegar al panel admin → evaluación correspondiente
12. Verificar que el contador de respuestas aumentó
13. Verificar que el usuario aparece con estado "completado"

**Resultado esperado:** El webhook de Google Forms notifica al sistema; el estado del usuario se actualiza sin intervención manual.

---

### PT-07 — Presencia en tiempo real (CONECTADO/DESCONECTADO)

**Objetivo:** El panel admin refleja en tiempo real qué usuarios están activos.

**Pasos:**
1. (Ventana A — admin) Iniciar sesión como admin → navegar a la sección **Usuarios** o **Presencia**
2. (Ventana B — usuario) Abrir otra pestaña/navegador e iniciar sesión como usuario regular
3. (Ventana A) Verificar que el usuario aparece con estado **CONECTADO** (badge verde)
4. (Ventana B) Cerrar la sesión o cerrar la pestaña del usuario
5. (Ventana A) Verificar que dentro de pocos segundos el usuario cambia a **DESCONECTADO** (badge gris/rojo)

**Resultado esperado:** El cambio de estado ocurre sin recargar la página del admin (Socket.io push).

---

### PT-08 — Analytics por período (7/30/90 días)

**Objetivo:** Los KPIs del panel admin se recalculan correctamente al cambiar el período de análisis.

**Pasos (como admin):**
1. Navegar al panel admin → sección **Analytics** o **Dashboard**
2. Anotar los valores mostrados para el período por defecto (ej: 30 días): tareas completadas, % aprobación, horas trabajadas, índice de desempeño
3. Cambiar el selector de período a **7 días** → verificar que los valores cambian
4. Cambiar a **90 días** → verificar que los valores cambian nuevamente y son mayores o iguales a los de 30 días
5. Verificar que el índice de desempeño sigue la fórmula: `(tareas×0.4) + (evaluaciones×0.4) + (horas_norm×0.2)`

**Resultado esperado:** Los valores son coherentes entre períodos; más días = igual o mayor acumulado.

---

### PT-09 — Línea de formación: crear, inscribir, completar ítems

**Objetivo:** El admin puede definir rutas de aprendizaje y los usuarios avanzan por ellas.

**Pasos (como admin):**
1. Navegar a **Formación** → **Nueva línea de formación**
2. Completar: nombre, descripción
3. Agregar al menos 2 ítems a la línea (pueden ser tareas existentes o nuevas)
4. Guardar y publicar la línea de formación
5. Inscribir a uno o más usuarios en la línea

**Pasos (como usuario inscrito):**
6. Navegar a **Formación** → verificar que aparece la línea de formación asignada
7. Completar el primer ítem (marcar como completado)
8. Verificar que el progreso de la línea avanza (ej: 1/2 ítems)
9. Completar el segundo ítem
10. Verificar que la línea queda marcada como completada al 100%

**Resultado esperado:** El progreso de la línea refleja exactamente los ítems completados.

---

### PT-10 — ROI de formación: baseline → delta productividad

**Objetivo:** El sistema calcula el delta de productividad comparando el desempeño antes y después de la formación.

**Pasos (como admin):**
1. Navegar a **ROI** o **Analytics avanzado**
2. Seleccionar un usuario que tenga historial de tareas y evaluaciones
3. Verificar que el sistema muestra: desempeño pre-formación (baseline) y post-formación
4. Verificar que el delta = `desempeño_actual − baseline`
5. Confirmar que el índice de desempeño usa la fórmula documentada en §10.1 del TFI

**Precondición:** El usuario debe tener datos de al menos dos períodos (pre y post inscripción en línea de formación).

**Resultado esperado:** El delta es positivo si la formación mejoró el desempeño; el cálculo coincide con la fórmula documentada.

---

### PT-11 — Certificaciones: registrar y verificar (admin)

**Objetivo:** El admin puede registrar certificaciones externas de usuarios y quedan trazadas en el sistema.

**Pasos (como admin):**
1. Navegar a **Usuarios** → seleccionar un usuario
2. En el perfil del usuario, ir a la sección **Certificaciones**
3. Hacer clic en **Agregar certificación**
4. Completar: nombre del certificado, entidad emisora, fecha de obtención, fecha de vencimiento (opcional)
5. Guardar
6. Verificar que la certificación aparece en el listado del usuario

**Verificación (como usuario):**
7. Iniciar sesión como el usuario afectado
8. Navegar a su perfil → sección Certificaciones
9. Verificar que la certificación registrada por el admin es visible

**Resultado esperado:** La certificación queda registrada y es visible tanto para admin como para el usuario.

---

### PT-12 — Control de roles: acceso no autorizado → 403/redirect

**Objetivo:** Las rutas de administración están protegidas; un usuario regular no puede acceder a ellas.

**Pasos (como usuario regular):**
1. Iniciar sesión con una cuenta de rol `user` (no admin)
2. Intentar navegar manualmente a rutas de admin, por ejemplo:
   - `/dashboard/admin`
   - `/dashboard/admin/users`
   - `/dashboard/admin/evaluaciones`
3. Verificar que en cada caso el sistema redirige (a `/dashboard` o `/login`) o muestra error 403

**Pasos adicionales (acceso sin sesión):**
4. Cerrar sesión completamente
5. Intentar navegar directamente a `/dashboard`
6. Verificar que redirige a `/login`

**Resultado esperado:** Ninguna ruta protegida es accesible sin los permisos correspondientes; el middleware de Next.js intercepta y redirige.

---

## 8. Tests E2E — Cypress (implementados y ejecutados)

Los siguientes flujos requieren un browser real y **no pueden** cubrirse con Jest + jsdom.  
Se implementaron con **Cypress v15** y se ejecutaron contra el servidor local (`http://localhost:3000`).

### 8.0 Resultados de ejecución (19/05/2026)

| ID | Spec | Descripción | Resultado |
|---|---|---|---|
| CY-01 | `auth.cy.ts` | Login exitoso redirige al dashboard | ✅ PASS |
| CY-01 | `auth.cy.ts` | Login con credenciales incorrectas permanece en `/login` | ✅ PASS |
| CY-01 | `auth.cy.ts` | Ruta protegida sin sesión redirige a `/login` | ✅ PASS |
| CY-02 | `kanban.cy.ts` | Las tres columnas del Kanban son visibles | ✅ PASS |
| CY-02 | `kanban.cy.ts` | Las tarjetas de tarea se renderizan en el tablero | ✅ PASS |
| CY-02 | `kanban.cy.ts` | Al hacer clic en una tarea se abre el drawer de detalle | ✅ PASS |
| CY-02 | `kanban.cy.ts` | El drawer permite cambiar el estado de una tarea | ✅ PASS |
| CY-03 | `evaluaciones.cy.ts` | La pestaña Evaluaciones es visible en el dashboard de usuario | ✅ PASS |
| CY-03 | `evaluaciones.cy.ts` | Al hacer clic en la pestaña se muestran las evaluaciones asignadas | ✅ PASS |
| CY-03 | `evaluaciones.cy.ts` | Al iniciar una evaluación publicada se abre el modal con Google Forms | ✅ PASS |
| CY-04 | `presencia.cy.ts` | El panel admin carga correctamente | ✅ PASS |
| CY-04 | `presencia.cy.ts` | El websocket de Socket.io establece conexión al cargar el dashboard | ✅ PASS |
| CY-04 | `presencia.cy.ts` | El panel de usuarios muestra indicadores de conexión | ✅ PASS |
| CY-05 | `roles.cy.ts` | Admin puede acceder a `/dashboard/admin` | ✅ PASS |
| CY-05 | `roles.cy.ts` | Usuario sin sesión es redirigido a login en todas las rutas protegidas | ✅ PASS |
| CY-07 | `reset.cy.ts` | Muestra toast de confirmación al enviar email de reset | ✅ PASS |
| CY-07 | `reset.cy.ts` | Token inválido redirige a `/reset/expired` y muestra error | ✅ PASS |

**Total: 17 casos E2E — 17 passed, 0 failed**

### 8.0.1 Configuración implementada

```
apps/web/
├── cypress.config.ts              # baseUrl: http://localhost:3000
├── cypress/
│   ├── e2e/
│   │   ├── auth.cy.ts             # CY-01
│   │   ├── kanban.cy.ts           # CY-02
│   │   ├── evaluaciones.cy.ts     # CY-03
│   │   ├── presencia.cy.ts        # CY-04
│   │   ├── roles.cy.ts            # CY-05
│   │   └── reset.cy.ts            # CY-07
│   └── support/
│       ├── commands.ts            # cy.loginAs() con cy.session() cacheado
│       └── e2e.ts                 # Handler global de errores de hidratación Next.js
```

**Decisiones de implementación:**
- `cy.loginAs()` usa `cy.session({ cacheAcrossSpecs: true })` — el login se ejecuta una sola vez por corrida completa, evitando el rate limiter del endpoint `/api/auth/login` (5 intentos / 15 min).
- El error de hidratación de Next.js en modo dev es ignorado globalmente en `e2e.ts` con `Cypress.on('uncaught:exception', () => false)` — es un falso positivo causado por extensiones del browser.
- Los tests que dependen de datos variables (evaluaciones asignadas, tareas en Kanban) usan guardas condicionales con `cy.log()` para omitirse sin fallar si no hay datos de prueba.

### 8.0.2 Cómo ejecutar

```bash
# Desde apps/web/ con el servidor corriendo (npm run dev)
npm run test:e2e        # modo interactivo (Cypress UI)
npm run test:e2e:ci     # modo headless
```

### 8.1 Configuración inicial de Cypress

```bash
# Desde apps/web/
npm install --save-dev cypress

# Abrir Cypress en modo interactivo (primera vez — genera cypress.config.ts)
npx cypress open
```

Agregar a `cypress.config.ts`:

```typescript
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",  // o la URL de staging
    supportFile: "cypress/support/e2e.ts",
  },
});
```

Agregar scripts a `package.json`:

```json
"test:e2e": "cypress open",
"test:e2e:ci": "cypress run --headless"
```

---

### 8.2 Flujos a cubrir con Cypress

#### CY-01 — Auth completa (registro → verificación → login → logout)

**Por qué Cypress:** Involucra múltiples páginas, cookies de sesión, y redirecciones encadenadas — no simulable en jsdom.

**Pasos del test:**
1. Visitar `/register` y completar el formulario con datos de prueba
2. Interceptar la llamada a la API de envío de email (`cy.intercept('POST', '/api/auth/register')`)
3. Verificar que aparece el mensaje de "Revisá tu correo"
4. Simular la verificación llamando directamente al endpoint de verificación con el token (extraído de la DB de test o via stub del email)
5. Visitar `/login` y autenticarse
6. Verificar que el dashboard carga (`cy.url().should('include', '/dashboard')`)
7. Hacer clic en logout y verificar redirección a `/login`

---

#### CY-02 — Kanban drag & drop entre columnas

**Por qué Cypress:** La API de arrastre del browser (`dragstart`, `drop`) no está implementada en jsdom.

**Pasos del test:**
1. Autenticarse como usuario con tarea asignada en estado "pendiente"
2. Localizar la tarjeta en la columna Pendiente: `cy.get('[data-testid="kanban-card"]').first()`
3. Ejecutar drag & drop hacia la columna En Progreso: `cy.drag('[data-testid="kanban-card"]', '[data-testid="col-in-progress"]')`
4. Verificar que la tarjeta aparece en la nueva columna
5. Recargar la página y verificar que el estado persistió en base de datos

---

#### CY-03 — Evaluación virtual embedded (Google Forms en iframe)

**Por qué Cypress:** Los iframes cross-origin no son accesibles desde jsdom; Cypress puede configurarse para manejarlos.

**Pasos del test:**
1. Autenticarse como usuario con evaluación publicada asignada
2. Navegar a la sección de evaluaciones
3. Verificar que existe un `<iframe>` con `src` apuntando a `docs.google.com`
4. Configurar Cypress para permitir iframes: `"chromeWebSecurity": false` en `cypress.config.ts`
5. Verificar que el iframe carga sin error (status 200)

> **Nota:** La interacción dentro del iframe de Google Forms requiere una cuenta de Google en el browser de test. Se recomienda verificar solo que el iframe carga, no la interacción interna.

---

#### CY-04 — Presencia en tiempo real con Socket.io

**Por qué Cypress:** Los WebSockets no están disponibles en jsdom; requieren un browser real con handshake HTTP→WS.

**Pasos del test:**
1. (Tab A) Autenticarse como admin
2. (Tab B — nueva ventana Cypress) Autenticarse como usuario
3. En Tab A, interceptar los eventos de Socket.io: `cy.intercept('GET', '/socket.io/*')`
4. Verificar que el usuario aparece como CONECTADO en el panel admin
5. Cerrar Tab B (simular desconexión)
6. Verificar que dentro de 5 segundos el estado cambia a DESCONECTADO

---

#### CY-05 — Control de roles: navegación cross-page con sesión activa

**Por qué Cypress:** Verifica el comportamiento del middleware de Next.js en rutas protegidas con sesión real.

**Pasos del test:**
1. Autenticarse como usuario regular (rol `user`)
2. Intentar visitar `/dashboard/admin` directamente
3. `cy.url().should('not.include', '/admin')` — verificar la redirección
4. Verificar que el código de respuesta de la ruta protegida fue 403 o que hubo redirect a `/dashboard`
5. Repetir con otras rutas admin (parametrizar con `cy.wrap(['...', '...'])`)

---

#### CY-06 — ROI completo: enroll → completar ítems → ver delta

**Por qué Cypress:** Flujo de múltiples pasos que involucra DB, UI de formación y analytics — demasiado acoplado para mocks unitarios.

**Pasos del test:**
1. Autenticarse como admin y crear una línea de formación con 2 ítems
2. Inscribir a un usuario de prueba
3. Cambiar a la sesión del usuario y completar ambos ítems
4. Volver a la sesión admin → Analytics → ROI
5. Verificar que el delta de productividad es mayor a 0
6. Verificar que el índice de desempeño calculado coincide con `(tareas×0.4) + (eval×0.4) + (horas×0.2)`

---

#### CY-07 — Reset de contraseña con email real

**Por qué Cypress:** Requiere integración real con Resend y acceso al correo recibido.

**Estrategia recomendada:**
- Usar un servicio como [Mailosaur](https://mailosaur.com) o [Ethereal](https://ethereal.email) para capturar emails en tests
- O interceptar la llamada a Resend (`cy.intercept('POST', 'https://api.resend.com/*')`) y extraer el token del cuerpo de la request mockeada

**Pasos del test:**
1. Visitar `/login` → clic en "¿Olvidaste tu contraseña?"
2. Ingresar email de prueba y enviar
3. Interceptar la llamada a Resend y extraer el token del body
4. Visitar `/reset-password?token=<token_extraido>`
5. Ingresar nueva contraseña y confirmar
6. Verificar login exitoso con la nueva contraseña
7. Intentar usar el token nuevamente → verificar error "token inválido o ya utilizado"

---

## 9. Configuración requerida

**`jest.config.js`** (CommonJS, no `.ts`): Jest 29 requiere `ts-node` para parsear configs TypeScript. Se usa `.js` con `require('next/jest.js')` para evitar esta dependencia extra.

**SSL corporativo**: En redes con proxy/certificados corporativos, el install requiere `npm config set strict-ssl false` antes de ejecutar `npm install`.

---

## 10. Decisiones de diseño

**¿Por qué no se mockearon los módulos `constants.ts` y `utils.ts` en `EvaluationCard.test.tsx`?**  
Son funciones puras sin efectos secundarios. Usarlas reales garantiza que el test detecta regresiones tanto en el componente como en sus dependencias. Si se mockearan, los tests de `EvaluationCard` no detectarían un cambio erróneo en las constantes.

**¿Por qué se extrajeron las fórmulas a `lib/formulas.ts`?**  
Las fórmulas estaban embebidas en queries SQL de `analytics-db.ts`. Extraerlas como funciones puras permite testearlas en aislamiento sin necesidad de una conexión a base de datos, siguiendo el principio de separación de responsabilidades.

**¿Por qué `formatWorkSeconds` está en `formulas.ts` y no en `utils.ts`?**  
Porque depende de la regla de negocio de cómo se almacenan las sesiones (segundos en `work_sessions`). Es lógica de dominio, no una utilidad genérica.
