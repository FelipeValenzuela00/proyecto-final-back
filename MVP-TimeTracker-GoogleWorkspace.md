# MVP - Time Tracker con Google Workspace + IA

## Contexto del Proyecto

**Materia:** Proyecto Final  
**Cliente:** Marcelo Baldini  
**Equipo:** 5 integrantes (~41 hs/semana totales)  
**Inicio:** 10 de abril de 2026  
**Deadline MVP:** 15 de junio de 2026 (10 semanas)  
**Stack:** Node.js (backend) | React (frontend) | BD a definir

---

## Capacidad del Equipo

| Concepto | Horas |
|---|---|
| Horas brutas totales (41 hs x 10 semanas) | 410 hs |
| Reuniones (~2 hs/semana x 10) | -20 hs |
| Documentacion academica estimada | -40 hs |
| Testing, bugfixing, deploy, imprevistos (~15%) | -52 hs |
| **Horas productivas de desarrollo** | **~298 hs** |

---

## Alcance del MVP

### Que SI entra en el MVP

1. **Autenticacion OAuth con Google** (scopes minimos)
2. **Recoleccion de actividad diaria** desde Google Workspace APIs (consulta batch, 1 vez al dia)
3. **Generacion de resumen diario con IA** (un proveedor, interfaz abstracta)
4. **Dashboard web** para que el empleado vea, edite y confirme su informe
5. **Panel de administrador** basico (ver informes de empleados)
6. **Persistencia de informes** en base de datos
7. **Deploy funcional EN UN PROVEEDOR** en un proveedor cloud

### Que NO entra en el MVP

- Monitoreo en tiempo real
- Integracion con Finnegans
- Multiples proveedores de IA simultaneos
- App mobile
- Tolerancia de inactividad configurable por admin (se usa un valor fijo)
- Notificaciones push/email

---

## Google Workspace APIs a utilizar

| API | Que nos da | Scope OAuth recomendado |
|---|---|---|
| **Google Calendar API** | Eventos, reuniones, Meet (duracion, asistentes) | `calendar.events.readonly` |
| **Google Drive API** | Archivos abiertos/editados con timestamps (Docs, Sheets, Slides) | `drive.metadata.readonly` |
| **Google Drive Activity API** | Historial detallado de acciones sobre archivos (crear, editar, comentar, compartir) | `drive.activity.readonly` |

### Notas sobre las APIs

- **NO usamos Gmail API** para el MVP (agrega complejidad y problemas de privacidad).
- **Drive Activity API** es la clave: nos da timestamps de cada accion sin acceder al contenido de los archivos.
- **Calendar API** nos da las reuniones de Meet (Meet no tiene API propia para historial).
- Los scopes elegidos son **readonly** y **de metadata**, evitando acceso al contenido real de documentos y correos.
- No se requiere acceso a cuenta corporativa (admin consent). Cada usuario autoriza individualmente.

---

## Arquitectura de Alto Nivel

```
[Usuario] --> [React SPA] --> [API Node.js]
                                   |
                        +----------+----------+
                        |          |          |
                   [Google APIs] [IA Module] [Base de Datos]
                                   |
                            [Proveedor IA]
                         (OpenAI / Gemini / etc)
```

### Principios de diseno

- **IA desacoplada:** interfaz/contrato generico para el modulo de IA. Se implementa un adapter para un proveedor (ej: OpenAI). Cambiar de proveedor = nuevo adapter, sin tocar logica de negocio.
- **Cloud-agnostic:** containerizar con Docker. Sin dependencias de servicios propietarios de un cloud especifico. La BD debe poder correr en cualquier lado (PostgreSQL recomendado).
- **BD recomendada:** PostgreSQL (gratuita, robusta, bien documentada, funciona en cualquier cloud).

> **Nota sobre genericidad:** La arquitectura esta disenada para ser generica desde el dia 1. El modulo de IA usa el patron Adapter: se define una interfaz (`input: actividades` → `output: resumen`) y se implementa un adapter concreto por proveedor. En el MVP se implementa **un solo adapter** (ej: OpenAI) por cuestiones de tiempo, pero agregar Gemini, Claude u otro proveedor es crear un nuevo archivo adapter sin modificar la logica de negocio. Lo mismo aplica para el cloud: Docker + PostgreSQL funcionan en cualquier proveedor (Railway, Render, AWS, GCP, VM propia).

### Arquitectura del Backend: Monolito Modular

Se recomienda un **Monolito Modular** como patron arquitectonico del backend. Esto significa una unica aplicacion desplegable, organizada internamente por modulos de dominio, donde cada modulo tiene sus propias capas (routes, controllers, services, models).

#### Por que Monolito Modular y no otras opciones

| Arquitectura | Descartada? | Razon |
|---|---|---|
| **MVC plano** (todo en `/controllers`, `/services`) | Si | Con 5 devs trabajando en paralelo, genera conflictos de merge constantes en los mismos archivos |
| **Clean Architecture / Hexagonal** | Si | Demasiada abstraccion para un equipo junior con 10 semanas. Mas tiempo aprendiendo patterns que construyendo |
| **Microservicios** | Si | Complejidad operativa innecesaria (deploy, networking, observabilidad) para un MVP interno |
| **Monolito Modular** | **No** | Simple, organizado por dominio, minimiza conflictos de merge, cada dev trabaja en su carpeta |

#### Estructura de carpetas propuesta

```
src/
  modules/
    auth/                  ← Fase 1: Autenticacion OAuth
      auth.routes.js
      auth.controller.js
      auth.service.js
      auth.model.js
    google/                ← Fase 2: Integracion Google APIs
      google.routes.js
      google.controller.js
      calendar.service.js
      drive-activity.service.js
    ai/                    ← Fase 3: Modulo IA (adapter pattern)
      ai.interface.js      ← Contrato generico
      openai.adapter.js    ← Implementacion concreta MVP
      ai.service.js
    reports/               ← Fase 3-4: Informes
      reports.routes.js
      reports.controller.js
      reports.service.js
      reports.model.js
    admin/                 ← Fase 5: Panel Admin
      admin.routes.js
      admin.controller.js
      admin.service.js
  shared/
    middleware/             ← Auth middleware, error handler
    database/              ← Conexion, migraciones
    config/                ← Variables de entorno, constantes
    utils/                 ← Helpers compartidos
  app.js
  server.js
```

#### Beneficios clave

- **Modulo = Fase = Desarrollador:** cada persona trabaja en su propia carpeta, minimizando conflictos de merge.
- **Adapter pattern solo donde tiene sentido:** en el modulo `ai/`, no en todo el sistema.
- **Facil de entender:** un junior puede comprender la estructura completa en menos de una hora.
- **Escalable:** si post-MVP se necesita mas complejidad, se puede refactorear un modulo sin afectar a los demas.

---

## Fases y Tareas

### FASE 0 - Setup y Arquitectura (Semana 1-2)

| ID | Tarea | Descripcion | Horas est. |
|---|---|---|---|
| F0-01 | Setup del repositorio | Crear repo, configurar linter, prettier, gitignore, estructura de carpetas, README | 3 |
| F0-02 | Setup proyecto backend | Inicializar proyecto Node.js con Express/Fastify, estructura de Monolito Modular (modules/auth, modules/google, modules/ai, modules/reports, modules/admin, shared/) | 4 |
| F0-03 | Setup proyecto frontend | Crear app React con Vite, estructura de carpetas, configurar router | 4 |
| F0-04 | Dockerizacion base | Dockerfile para backend, frontend y docker-compose con BD | 6 |
| F0-05 | Definir y crear modelo de datos | Disenar schema de BD: usuarios, informes, actividades, sesiones. Crear migraciones | 8 |
| F0-06 | Configurar CI basico | Pipeline que corra lint y tests en cada push (GitHub Actions) | 4 |
| F0-07 | Documentar arquitectura | Diagrama de arquitectura, decisiones tecnicas, ADRs basicos, diagrama de dependencias entre fases | 6 |
| | **Subtotal Fase 0** | | **35 hs** |

### FASE 1 - Autenticacion OAuth (Semana 2-3)

| ID | Tarea | Descripcion | Horas est. |
|---|---|---|---|
| F1-01 | Crear proyecto en Google Cloud Console | Configurar OAuth consent screen, credenciales, scopes | 4 |
| F1-02 | Implementar flujo OAuth en backend | Endpoint de login, callback, intercambio de tokens, refresh token | 14 |
| F1-03 | Almacenar tokens de forma segura | Encriptar refresh tokens en BD, manejo de expiracion | 6 |
| F1-04 | Implementar login en frontend | Boton de login con Google, manejo de sesion, redirect | 8 |
| F1-05 | Middleware de autenticacion | Verificar JWT/sesion en cada request protegido | 6 |
| F1-06 | Manejo de roles (Empleado/Admin) | Modelo de roles en BD, middleware de autorizacion | 5 |
| F1-07 | Testing del flujo OAuth | Tests manuales + unitarios del flujo completo | 5 |
| | **Subtotal Fase 1** | | **48 hs** |

### FASE 2 - Integracion con Google APIs (Semana 3-5)

| ID | Tarea | Descripcion | Horas est. |
|---|---|---|---|
| F2-01 | Investigar y prototipar Google Calendar API | Obtener eventos del dia, parsear datos de Meet, entender estructura de response | 8 |
| F2-02 | Implementar servicio de Calendar | Servicio que consulte eventos del dia de un usuario, mapear a modelo interno | 10 |
| F2-03 | Investigar y prototipar Drive Activity API | Obtener actividad del dia, entender tipos de accion, filtrar por timestamp | 8 |
| F2-04 | Implementar servicio de Drive Activity | Servicio que consulte actividad del dia, identificar app (Docs/Sheets/Slides), calcular duracion estimada | 14 |
| F2-05 | Logica de consolidacion de actividad | Unificar datos de Calendar + Drive en una timeline del dia. Agrupar por app, calcular tiempos | 12 |
| F2-06 | Manejo de errores y tokens expirados | Retry con refresh token, manejo de revocacion de permisos, logging | 6 |
| F2-07 | Testing de integracion con APIs | Tests con datos reales y mocks, validar edge cases (dia sin actividad, token expirado) | 8 |
| | **Subtotal Fase 2** | | **66 hs** |

### FASE 3 - Modulo de IA (Semana 5-6)

| ID | Tarea | Descripcion | Horas est. |
|---|---|---|---|
| F3-01 | Disenar interfaz generica del modulo IA | Definir contrato/interfaz: input (actividades del dia) -> output (resumen texto) | 4 |
| F3-02 | Implementar adapter para OpenAI (o Gemini) | Llamada a API, prompt engineering, parseo de respuesta | 10 |
| F3-03 | Disenar prompt de generacion de resumen | Iterar sobre el prompt para que genere un resumen util y accionable para el trabajador | 8 |
| F3-04 | Endpoint de generacion de resumen | POST /api/reports/generate que consolide actividad + llame a IA + persista resultado | 8 |
| F3-05 | Testing del modulo IA | Tests con distintos inputs, validar que el resumen tiene sentido, manejo de errores de API | 5 |
| | **Subtotal Fase 3** | | **35 hs** |

### FASE 4 - Frontend - Dashboard Empleado (Semana 6-8)

| ID | Tarea | Descripcion | Horas est. |
|---|---|---|---|
| F4-01 | Layout principal y navegacion | Sidebar/navbar, rutas protegidas, layout responsive basico | 6 |
| F4-02 | Pantalla de dashboard diario | Vista del dia: timeline de actividades detectadas, tiempo por app | 12 |
| F4-03 | Pantalla de informe generado | Mostrar resumen de IA, permitir edicion de texto libre | 10 |
| F4-04 | Confirmar y guardar informe | Boton de confirmacion, llamada al backend, feedback visual | 5 |
| F4-05 | Historial de informes | Lista de informes pasados con filtro por fecha | 8 |
| F4-06 | Pantalla de perfil/configuracion | Ver datos del usuario, estado de conexion con Google, revocar permisos | 5 |
| | **Subtotal Fase 4** | | **46 hs** |

### FASE 5 - Frontend - Panel Admin (Semana 8-9)

| ID | Tarea | Descripcion | Horas est. |
|---|---|---|---|
| F5-01 | Vista de lista de empleados | Tabla con empleados registrados, estado de informe del dia | 8 |
| F5-02 | Vista de informe de un empleado | Ver detalle de informe diario de cualquier empleado | 6 |
| F5-03 | Filtros y busqueda basica | Filtrar por fecha, por empleado, por estado (pendiente/confirmado) | 6 |
| | **Subtotal Fase 5** | | **20 hs** |

### FASE 6 - Job Diario y Deploy (Semana 9-10)

| ID | Tarea | Descripcion | Horas est. |
|---|---|---|---|
| F6-01 | Implementar job/cron diario | Tarea programada que recolecte actividad de todos los usuarios al final del dia | 8 |
| F6-02 | Deploy en cloud | Subir contenedores Docker a un proveedor (Railway, Render, o VM con docker-compose) | 10 |
| F6-03 | Configurar variables de entorno y secrets | Manejo seguro de API keys, tokens, connection strings en produccion | 4 |
| F6-04 | Testing end-to-end en produccion | Probar flujo completo en entorno productivo con usuarios reales | 8 |
| F6-05 | Bugfixing final | Buffer para corregir bugs encontrados en testing e2e | 10 |
| | **Subtotal Fase 6** | | **40 hs** |

### Documentacion Academica (Transversal)

| ID | Tarea | Descripcion | Horas est. |
|---|---|---|---|
| DOC-01 | Documento de relevamiento | Problematica, contexto, minutas con cliente | 6 |
| DOC-02 | Documento de arquitectura y diseno | Diagramas, decisiones tecnicas, modelo de datos | 8 |
| DOC-03 | Manual de usuario | Guia de uso del sistema para empleados y admins | 6 |
| DOC-04 | Informe final / presentacion | Documento de cierre, conclusiones, lecciones aprendidas | 8 |
| | **Subtotal Documentacion** | | **28 hs** |

---

## Resumen de Horas por Fase

| Fase | Horas |
|---|---|
| Fase 0 - Setup y Arquitectura | 35 |
| Fase 1 - Autenticacion OAuth | 48 |
| Fase 2 - Google APIs | 66 |
| Fase 3 - Modulo IA | 35 |
| Fase 4 - Frontend Empleado | 46 |
| Fase 5 - Frontend Admin | 20 |
| Fase 6 - Job Diario y Deploy | 40 |
| Documentacion Academica | 28 |
| **TOTAL** | **318 hs** |

**Capacidad disponible estimada: ~298 hs**

> **Nota:** El plan esta ~20 hs por encima de la capacidad estimada. Esto es intencional: algunas tareas se solapan, y el equipo debera priorizar y recortar si se atrasa. Las primeras candidatas a reducir son F5-03 (filtros admin), F4-05 (historial) y F4-06 (perfil). El margen es ajustado pero realista para un equipo junior.

---

## Deseables (Post-MVP / Si sobra tiempo)

Estos items NO estan contemplados en las 318 hs del MVP. Son extras que el cliente quiere y que se pueden abordar si el equipo avanza mas rapido de lo esperado.

### Deseable 1 - Tolerancia de inactividad configurable
- Permitir que el admin configure el umbral de minutos para considerar "inactividad" entre acciones.
- **Estimacion:** 8-12 hs
- **Depende de:** Fase 2 completa

### Deseable 2 - Integracion con multiples proveedores de IA
- Implementar un segundo adapter (ej: Gemini si el primero fue OpenAI) y permitir al admin elegir proveedor.
- **Estimacion:** 10-14 hs
- **Depende de:** Fase 3 completa

### Deseable 3 - Notificaciones
- Recordatorio diario al empleado para que revise y confirme su informe.
- **Estimacion:** 8-10 hs
- **Depende de:** Fase 4 completa

### Deseable 4 - Integracion con Finnegans
- Enviar el informe confirmado a Finnegans via API para carga automatica de horas.
- **Estimacion:** 15-25 hs (depende de la documentacion que envie el cliente)
- **Depende de:** MVP completo + documentacion de Finnegans

### Deseable 5 - Gmail API
- Agregar actividad de correo electronico a la timeline (cantidad de correos enviados/recibidos, sin leer contenido).
- **Estimacion:** 10-15 hs
- **Depende de:** Fase 2 completa, requiere scope adicional de OAuth

### Deseable 6 - Reportes agregados para admin
- Graficos de horas por equipo, por semana, exportar a CSV/Excel.
- **Estimacion:** 15-20 hs
- **Depende de:** Fase 5 completa

---

## Cronograma Sugerido (10 semanas)

| Semana | Fechas | Foco principal | Fases |
|---|---|---|---|
| 1 | 10-16 abr | Setup, arquitectura, investigacion Google APIs | F0 |
| 2 | 17-23 abr | OAuth backend + investigacion APIs | F0 (cierre) + F1 (inicio) |
| 3 | 24-30 abr | OAuth completo + inicio Google APIs | F1 (cierre) + F2 (inicio) |
| 4 | 1-7 may | Google APIs (Calendar + Drive Activity) | F2 |
| 5 | 8-14 may | Google APIs (consolidacion) + inicio IA | F2 (cierre) + F3 (inicio) |
| 6 | 15-21 may | Modulo IA completo + inicio frontend | F3 (cierre) + F4 (inicio) |
| 7 | 22-28 may | Frontend empleado | F4 |
| 8 | 29 may-4 jun | Frontend empleado (cierre) + admin | F4 (cierre) + F5 |
| 9 | 5-11 jun | Admin + job diario + deploy | F5 (cierre) + F6 |
| 10 | 12-15 jun | Testing e2e, bugfixing, entrega | F6 (cierre) + DOC |

> **Importante:** La documentacion academica (DOC-01 a DOC-04) se trabaja de forma transversal a lo largo de todas las semanas, no se deja para el final.

---

## Dependencias entre Fases

### Diagrama de dependencias

```
                    ┌──────────────────────────────────────────────────┐
                    │                                                  │
F0 (Setup) ────┬───┼──→ F1 (OAuth) ──→ F2 (Google APIs) ──→ F3 (IA) ─┤
               │   │                                                   ├──→ F6 (Deploy)
               │   └──→ F4 (Frontend Empleado) ──→ F5 (Frontend Admin)┤
               │            ↑                                          │
               │            │ (puede arrancar con mocks               │
               │            │  mientras F2-F3 avanzan)                 │
               │                                                       │
               └──→ DOC (Transversal, en paralelo todo el proyecto) ───┘
```

### Tabla de dependencias

| Fase | Depende de (dura) | Depende de (blanda/con mocks) | Puede empezar en paralelo con |
|---|---|---|---|
| **F0 - Setup** | - | - | DOC |
| **F1 - OAuth** | F0 completada | - | F0-frontend (F0-03) puede ir en paralelo con F0-backend (F0-02) |
| **F2 - Google APIs** | F1 completada (necesita tokens OAuth) | - | F4 puede arrancar con datos mock |
| **F3 - IA** | F2 completada (necesita datos de actividad) | - | F4 puede seguir avanzando con mocks |
| **F4 - Frontend Empleado** | F0-03 (setup frontend) | F2, F3 (puede usar datos mock hasta que esten listos) | F2, F3 |
| **F5 - Frontend Admin** | F4 (reutiliza layout y componentes base) | - | Final de F4 |
| **F6 - Deploy** | F1-F5 completadas | - | - |
| **DOC** | - | - | Todas (es transversal) |

### Oportunidades de paralelismo

El equipo tiene **5 integrantes**. Para maximizar la productividad y minimizar conflictos de merge:

| Semanas | Dev A | Dev B | Dev C | Dev D | Dev E |
|---|---|---|---|---|---|
| 1-2 | F0 backend (F0-02, F0-04) | F0 frontend (F0-03) | F0 modelo datos (F0-05) | F0 CI + repo (F0-01, F0-06) | DOC-01 + F0-07 |
| 2-3 | F1 backend OAuth (F1-02, F1-03) | F1 frontend login (F1-04) | F1 middleware + roles (F1-05, F1-06) | F1 Google Cloud Console (F1-01) | F1 testing (F1-07) |
| 3-5 | F2 Calendar (F2-01, F2-02) | F2 Drive Activity (F2-03, F2-04) | F4 layout + navegacion (F4-01) con mocks | F2 consolidacion (F2-05) | F2 errores + testing (F2-06, F2-07) |
| 5-6 | F3 interfaz + adapter (F3-01, F3-02) | F3 prompt + endpoint (F3-03, F3-04) | F4 dashboard + informe (F4-02, F4-03) | F4 historial + perfil (F4-05, F4-06) | F3 testing (F3-05) + DOC-02 |
| 7-8 | F4 confirmar informe (F4-04) | F5 lista empleados (F5-01) | F5 informe empleado (F5-02) | F5 filtros (F5-03) | Conectar frontend con APIs reales |
| 9-10 | F6 job diario (F6-01) | F6 deploy (F6-02, F6-03) | F6 testing e2e (F6-04) | F6 bugfixing (F6-05) | DOC-03 + DOC-04 |

> **Nota:** Esta distribucion es una guia, no un contrato rigido. El equipo debe hacer daily standups para redistribuir carga si alguien se bloquea o termina antes.

### Reglas para evitar conflictos de merge

1. **Cada dev trabaja en su modulo:** la estructura de Monolito Modular asigna carpetas separadas por dominio.
2. **`shared/` es zona de cuidado:** cambios en middleware, database o config deben coordinarse (PR review obligatorio).
3. **Branches por tarea:** cada F-XX se trabaja en su propia branch (`feature/F1-02-oauth-backend`).
4. **Merge a `develop` frecuente:** no acumular branches de mas de 3 dias sin mergear.

---

## Riesgos Principales

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Nadie tiene experiencia con OAuth ni Google APIs | Alto | Dedicar semana 1-2 a investigacion y prototipos. No empezar a construir sin entender las APIs | 
| Las Google APIs no devuelven datos suficientes para estimar tiempos | Alto | Prototipar en semana 3-4. Si no alcanza, pivotar a estimacion heuristica (ej: "estuvo en Docs entre las 10:00 y 10:45 basado en actividad") |
| El equipo se atrasa en OAuth | Medio | OAuth es critico. Si en semana 3 no esta resuelto, reducir scope de admin y frontend |
| Limites de quota de Google APIs (free tier) | Medio | Investigar limites desde el dia 1. Drive Activity API tiene 100k requests/dia (suficiente) |
| Dependencia del cliente para Finnegans | Bajo | Finnegans es deseable, no MVP. No bloquea nada |

---

## Decisiones Pendientes (llevar al cliente)

1. Confirmar que la recoleccion sea batch (1 vez al dia) y no en tiempo real
2. Confirmar que el sistema es web app (no mobile)
3. Definir horario del job diario (ej: 17:00 hs)
4. Solicitar documentacion de Finnegans
5. Validar que los empleados pueden autorizar OAuth individualmente (sin admin consent de la org)
