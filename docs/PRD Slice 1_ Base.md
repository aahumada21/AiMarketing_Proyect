# Prompt
> Elabora un PRD para el primer slice de IA‑Marketing, un SaaS multitenant para generar videos publicitarios cortos.
>
> Roles:
> 
> Superadmin: configura parámetros globales del servicio y define prompts preconfigurados.
> Administrador de empresa: gestiona créditos, crea proyectos y asigna miembros.
> Miembro de proyecto: genera videos utilizando los créditos asignados.
> Los créditos se descuentan por cada video generado. Los videos se asocian al proyecto junto con la configuración utilizada (metadata). Al generar videos, los usuarios pueden seleccionar prompts preconfigurados, usarlos como base para personalizar sus propios prompts o empezar desde cero.
>
> Como base tecnologica voy a usar Next.js con tailwind + los servicios de Supabase (Auth, DB, Storage), el deploy final sera en Versel



¡Perfecto, Alex! A continuación tienes el **PRD (Product Requirements Document)** para el **primer slice** de **IA‑Marketing**, un SaaS **multitenant** para generar videos publicitarios cortos, construido con **Next.js + Tailwind**, **Supabase (Auth, DB, Storage)** y deploy en **Vercel**.

> **Objetivo del slice 1:** cerrar el **camino end‑to‑end** “crear empresa → crear proyecto → invitar miembro → consumir créditos → generar video → ver/descargar video con su metadata”, con aislamiento multitenant y políticas RLS en Supabase.

---

## 1) Resumen ejecutivo

IA‑Marketing permite a equipos de marketing **generar videos publicitarios cortos** (p. ej., 6–30s) en base a **prompts preconfigurados** (definidos por Superadmin) o personalizados por cada usuario. Los **créditos** se **descuentan por video** y cada video queda **asociado a un proyecto**, registrando **toda la configuración utilizada (metadata)**.

**Roles:**
- **Superadmin:** configura parámetros globales y **prompts preconfigurados** globales.
- **Administrador de empresa:** gestiona **créditos**, crea **proyectos** y **asigna miembros**.
- **Miembro de proyecto:** **genera videos** usando los créditos disponibles.

---

## 2) Objetivos y métricas del primer slice

### Objetivos
1. **Multitenancy seguro** con RLS: todo dato aislado por organización.
2. **Créditos** a nivel organización (con límite opcional por proyecto).
3. **Generación asíncrona** de videos con estado `queued → processing → completed/failed`.
4. **Prompts preconfigurados globales** y posibilidad de **personalización puntual** antes de generar.
5. **Metadata completa** por video (prompt, parámetros, costos, versión de prompt).
6. **Panel de Admin**: saldo de créditos, proyectos, miembros, asignaciones básicas.
7. **Historial y descarga** del video desde Storage.

### Métricas de éxito (MVP)
- **Tasa de éxito de generación** ≥ 95% (completados vs. intentos).
- **Tiempo P50 de generación** ≤ X min (definir según proveedor).
- **Eventos de fuga multitenant**: 0.
- **Exactitud contable de créditos**: 100% (débitos atómicos).
- **Onboarding < 5 min** para primer video (desde empresa nueva).

---

## 3) Alcance (In / Out)

**Incluido (slice 1)**
- Auth con Supabase; creación de empresa; invitaciones por email.
- Roles y permisos (Superadmin / Admin empresa / Miembro proyecto).
- Wallet de créditos por organización + límites por proyecto (soft cap en UI, hard cap opcional).
- Biblioteca de **prompts globales** (Superadmin).
- Generación de video a partir de:
  - Prompt global sin cambios,
  - Prompt global + edición puntual,
  - Prompt desde cero.
- Estados de job asíncrono, webhook de actualización, almacenamiento del resultado en **Supabase Storage**.
- Listado de videos por proyecto, detalle con metadata, descarga.
- Auditoría básica (quién hizo qué y cuándo).
- Observabilidad mínima (logs de jobs).

**Excluido (futuro)**
- Pagos/checkout real (se gestionan créditos manualmente en Admin).
- Editor de video avanzado, timeline, subtítulos automáticos, voice cloning.
- Análisis de performance creativa, A/B testing, campañas multi‑asset.
- Marca/Brand kits, plantillas por empresa, biblioteca de assets avanzada.
- Moderación automatizada, revisión legal.

---

## 4) Roles y permisos (RBAC)

- **Superadmin:**
  - Configurar **parámetros globales** (p. ej., costo por video, límites por duración).
  - Crear/editar **prompts globales** (publicar versiones).
  - Ver métricas globales.
- **Admin de empresa:**
  - Crear/editar **proyectos** de su organización.
  - **Invitar**/remover **miembros**.
  - **Cargar/ajustar créditos** (manual en MVP) y **definir límites por proyecto**.
  - Ver uso/consumo por proyecto y miembro.
- **Miembro de proyecto:**
  - Acceder a proyectos donde es miembro.
  - Generar videos (si hay créditos) y ver/descargar resultados.
  - Ver su propio historial.

**Reglas clave**
- Deducción de créditos **por intento** de generación (no por vista), con posibilidad de **reembolso** automático si el job falla (opcional en slice 1, recomendado).

---

## 5) Historias de usuario (con criterios de aceptación)

### Superadmin
1. **Definir costo por video**
   - *Dado* que soy Superadmin, *cuando* ajusto “créditos por video”, *entonces* ese valor se usa en nuevas generaciones y queda auditable (fecha, usuario, versión).

2. **Publicar prompt global**
   - *Dado* que soy Superadmin, *cuando* publico un prompt global v1, *entonces* los usuarios pueden seleccionarlo al generar; cambios posteriores crean v2, manteniendo referencia de versión en cada video.

### Admin de empresa
3. **Crear empresa y proyecto**
   - *Cuando* creo la empresa y el proyecto “Lanzamiento Primavera”, *entonces* aparece en el dashboard con 0 videos y estado activo.

4. **Invitar miembros**
   - *Cuando* invito por email a un colega como miembro de proyecto, *entonces* recibe invitación y al aceptar puede ver el proyecto.

5. **Gestionar créditos**
   - *Cuando* ajusto el saldo de la organización a 100 créditos y pongo un límite de 20 créditos/mes para el proyecto, *entonces* las generaciones se bloquean si se supera el límite del proyecto o si el saldo org es insuficiente.

### Miembro de proyecto
6. **Generar video con prompt global**
   - *Dado* un proyecto con créditos, *cuando* selecciono un prompt global y genero, *entonces* se crea un job `queued`, se descuenta el crédito, y al completar puedo ver/descargar el video.

7. **Personalizar prompt**
   - *Cuando* uso un prompt global y modifico texto/params, *entonces* la metadata guarda: id de prompt, versión, y el diff (prompt final usado).

8. **Ver historial**
   - *Cuando* entro al proyecto, *entonces* veo una lista de videos con estado, fecha, autor, costo, y puedo abrir el detalle (metadata + descarga).

**Casos de error**
- Sin créditos suficientes → botón de generar deshabilitado + CTA para que Admin recargue.
- Job fallido → estado “failed” y opción de **reintento** (vuelve a descontar crédito si se rehace; reembolso opcional si se decide).

---

## 6) Flujos principales

### 6.1 Onboarding organización y proyecto
1. Admin crea organización.
2. Admin crea proyecto.
3. Admin invita miembros (email).
4. Admin ajusta créditos (manual).
5. Miembros aceptan invitación → login.

### 6.2 Generación de video
1. Miembro abre proyecto → “Nuevo video”.
2. Elige:
   - Prompt global, o
   - Prompt global + personalización, o
   - Desde cero.
3. Establece parámetros (duración, formato, aspect ratio; mínimos en slice 1).
4. Click **Generar**:
   - Llama RPC **`create_video_job()`** (ver más abajo) que **valida y descuenta créditos atómicamente**.
   - Job en `queued`.
5. Worker/proveedor procesa (`processing`).
6. Webhook recibe `completed` con URL del asset →
   - Sube a **Supabase Storage**,
   - Actualiza `video_jobs` con paths, thumbnails, metadata final.
7. UI refresca lista y muestra el video.

---

## 7) Requisitos funcionales (detallados)

- **Prompts**
  - Crear/editar/publicar **prompts globales** (Superadmin).
  - Campos: título, descripción, contenido (texto), variables (JSON), versión, estado (draft/published).
  - En la generación se guarda: `prompt_id`, `prompt_version`, `prompt_text_final`.

- **Créditos**
  - **Costo fijo por video** (slice 1, configurable por Superadmin).
  - **Deducción atómica** al crear job (si falla antes de `queued`, no deduce; si falla luego, política: reembolso opcional).
  - Ledger auditable (source: allocation | debit | refund).

- **Video jobs**
  - Estados: `queued | processing | completed | failed | canceled`.
  - Metadata: parámetros (JSONB) con duración, aspect ratio, estilo/plantilla.
  - Al finalizar, registrar **duración real**, tamaño, códec, thumbnail.

- **Storage**
  - Bucket `videos/` por organización/proyecto: `org_{id}/project_{id}/videos/{video_id}/...`
  - Bucket `thumbnails/` similar.
  - Reglas de acceso por RLS mediante signed URLs o edge proxy si se requiere.

- **UI/UX mínimas**
  - Dashboard Admin: saldo de créditos, botones “Ajustar créditos”, “Nuevo Proyecto”, listado de proyectos y consumo.
  - Vista Proyecto: lista de videos (tabla), botón “Nuevo video”, saldo y límite del proyecto, filtros (estado, autor).
  - Detalle Video: reproductor, metadata (prompt, parámetros, costo, timestamps), descarga.
  - Biblioteca de Prompts (visible en modal o panel lateral al generar).

---

## 8) Requisitos no funcionales

- **Seguridad**: RLS estricta; JWT con claims `org_id`; hashing de invitaciones; logs de auditoría.
- **Confiabilidad**: reintentos de webhook idempotentes; jobs con `retry_count`.
- **Escalabilidad**: generación asíncrona; no bloquear UI; uso de colas/worker o proveedor externo.
- **Observabilidad**: logs de jobs, métricas básicas por estado, alertas en fallos > X%.
- **Rendimiento**: P95 de respuesta de la UI < 300 ms (sin contar latencia del proveedor de video).
- **Compatibilidad**: navegadores modernos; H.264/MP4 para máxima compatibilidad (slice 1).

---

## 9) Modelo de datos (Supabase / Postgres)

> Nota: se asume `auth.users` como fuente de identidad. Creamos `profiles` para datos auxiliares y membership.

```sql
-- ORGANIZACIONES
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- PERFIL DE USUARIO (opcional pero útil)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- MEMBERSHIP A NIVEL ORGANIZACIÓN (rol org: admin | member)
create type org_role as enum ('admin', 'member', 'superadmin');

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- PROYECTOS
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- MEMBERSHIP A NIVEL PROYECTO
create type project_role as enum ('owner','member');

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role project_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- WALLET DE CRÉDITOS POR ORGANIZACIÓN
create table public.org_wallets (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  balance int not null default 0, -- créditos disponibles
  updated_at timestamptz not null default now()
);

-- LÍMITE (CUPO) POR PROYECTO (SOFT CAP) + USO ACUMULADO DEL MES
create table public.project_credit_limits (
  project_id uuid primary key references public.projects(id) on delete cascade,
  monthly_cap int not null default 0,  -- 0 = sin tope
  month_key date not null default date_trunc('month', now())::date,
  used_this_month int not null default 0,
  updated_at timestamptz not null default now()
);

-- LEDGER DE CRÉDITOS (auditable)
create type credit_source as enum ('allocation','debit','refund','adjustment');

create table public.credits_ledger (
  id bigserial primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  video_id uuid, -- se llena cuando aplica
  delta int not null, -- positivo o negativo
  source credit_source not null,
  reason text,
  created_at timestamptz not null default now()
);
create index on public.credits_ledger (organization_id, created_at);

-- PROMPTS (globales y por org)
create type prompt_scope as enum ('global','organization');

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  scope prompt_scope not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  content text not null,     -- prompt base
  variables jsonb not null default '[]'::jsonb,
  version int not null default 1,
  is_published boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- CONFIGURACIÓN GLOBAL (Superadmin)
create table public.global_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
-- ejemplo: ('credits_per_video', '10'), ('max_duration_sec','30')

-- VIDEO JOBS
create type job_status as enum ('queued','processing','completed','failed','canceled');

create table public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  status job_status not null default 'queued',
  provider text,                -- proveedor elegido
  provider_job_id text,         -- id en proveedor
  prompt_id uuid references public.prompts(id),
  prompt_version int,
  prompt_text_final text not null,
  parameters jsonb not null default '{}'::jsonb,   -- duración, aspect, estilo
  cost_credits int not null,    -- costo cobrado
  storage_video_path text,      -- path en Supabase Storage
  storage_thumbnail_path text,
  metadata jsonb not null default '{}'::jsonb,     -- códec, fps, duración real, etc.
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.video_jobs (project_id, created_at);
create index on public.video_jobs (status);
```

### Políticas RLS (esqueleto)
> Activar RLS en todas las tablas y usar **claims** en JWT (`org_id`, `is_superadmin`) para filtrar.

```sql
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.org_wallets enable row level security;
alter table public.project_credit_limits enable row level security;
alter table public.credits_ledger enable row level security;
alter table public.prompts enable row level security;
alter table public.video_jobs enable row level security;

-- Ej.: ORGANIZATIONS (leer solo si miembro; superadmin ve todas)
create policy org_select on public.organizations
for select using (
  exists (
    select 1 from public.organization_members m
    where m.organization_id = organizations.id
      and m.user_id = auth.uid()
  )
  or (current_setting('request.jwt.claims', true)::jsonb ->> 'is_superadmin')::boolean = true
);

-- Similar para projects/video_jobs/ledger: verificar que auth.uid() es miembro de esa org/proyecto.

-- PROMPTS: global visibles para todos; organization-scope solo para esa org.
create policy prompts_select on public.prompts
for select using (
  scope = 'global'
  or (
    scope = 'organization'
    and (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid = organization_id
  )
);
```

---

## 10) Transacciones y lógica crítica (RPC / SQL)

### Deducción atómica + creación de job
Crear una **función RPC** que:
1. Verifique **saldo org** y **cap del proyecto**.
2. **Descuente** créditos (ledger + wallet).
3. Cree el **video_job** en `queued` con el **cost_credits** fijado por `global_settings`.
4. Devuelva el `job_id`.

```sql
create or replace function public.create_video_job_rpc(
  p_project_id uuid,
  p_prompt_id uuid,
  p_prompt_version int,
  p_prompt_text_final text,
  p_parameters jsonb
) returns uuid
language plpgsql
security definer
as $$
declare
  v_org_id uuid;
  v_cost int;
  v_wallet int;
  v_job_id uuid := gen_random_uuid();
  v_user uuid := auth.uid();
  v_month date := date_trunc('month', now())::date;
begin
  -- Encontrar org del proyecto
  select organization_id into v_org_id from public.projects where id = p_project_id;

  -- Costo por video (valor global)
  select (value->>'credits_per_video')::int into v_cost
    from public.global_settings where key = 'credits_per_video';

  -- Saldo actual
  select balance into v_wallet from public.org_wallets where organization_id = v_org_id for update;

  if v_wallet is null then
    raise exception 'Wallet not found';
  end if;

  if v_wallet < v_cost then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  -- (Opcional) Validar tope mensual del proyecto
  perform 1 from public.project_credit_limits pcl
   where pcl.project_id = p_project_id and pcl.month_key = v_month and
         (pcl.monthly_cap > 0 and pcl.used_this_month + v_cost > pcl.monthly_cap)
   for update;
  if found then
    raise exception 'PROJECT_CAP_EXCEEDED';
  end if;

  -- Debitar wallet
  update public.org_wallets
    set balance = balance - v_cost,
        updated_at = now()
  where organization_id = v_org_id;

  -- Ledger
  insert into public.credits_ledger (organization_id, project_id, user_id, video_id, delta, source, reason)
  values (v_org_id, p_project_id, v_user, v_job_id, -v_cost, 'debit', 'video_generation');

  -- Acumular uso del mes
  insert into public.project_credit_limits (project_id, monthly_cap, month_key, used_this_month)
  values (p_project_id, 0, v_month, v_cost)
  on conflict (project_id) do update
    set used_this_month = project_credit_limits.used_this_month + excluded.used_this_month,
        updated_at = now();

  -- Crear job
  insert into public.video_jobs (
    id, organization_id, project_id, user_id, status,
    prompt_id, prompt_version, prompt_text_final, parameters, cost_credits
  ) values (
    v_job_id, v_org_id, p_project_id, v_user, 'queued',
    p_prompt_id, p_prompt_version, p_prompt_text_final, p_parameters, v_cost
  );

  return v_job_id;
end $$;
```

> **Nota:** Para **reembolsos** en fallo, crear `refund_video_job_rpc(video_id)` que:
> - Verifique que el job esté en `failed` y que no haya reembolso previo,
> - Inserte ledger `+cost` y **sume** al wallet,
> - Marque en `video_jobs.metadata.refunded=true`.

---

## 11) Integración de generación de video (asíncrona y agnóstica)

- **Proveedor**: abstraído detrás de un **service** (serverless function en Vercel).
- **Estrategia**: al crear el job (estado `queued`), una **function** (cron o invocación directa) manda a procesar al proveedor y actualiza estado `processing`.
- **Webhook**: endpoint `POST /api/webhooks/video-provider`:
  - Verifica firma (HMAC/API key).
  - Idempotencia (header `Idempotency-Key`).
  - Si `completed`: descarga/stream del asset al **Supabase Storage**, genera thumbnail (si aplica), actualiza `video_jobs` con paths y `status='completed'`.
  - Si `failed`: guarda `error_message` y `status='failed'` (y opcional reembolso).

**Buckets de Storage**
- `videos/org_{orgId}/project_{projectId}/video_{videoId}/output.mp4`
- `thumbnails/org_{orgId}/project_{projectId}/video_{videoId}/thumb.jpg`

---

## 12) Estructura de app (Next.js)

```
/app
  /(public)
    /signin
    /invite/accept
  /(app)
    /dashboard
      page.tsx                -- overview org (Admin)
    /projects
      /[projectId]
        page.tsx              -- listado videos
        /new
          page.tsx            -- formulario generación
        /videos/[videoId]
          page.tsx            -- detalle + descarga
  /superadmin
    /prompts                  -- CRUD prompts globales
    /settings                 -- créditos por video, límites globales
/api
  /jobs/create               -- llama RPC create_video_job_rpc
  /jobs/dispatch             -- opcional: envía a proveedor
  /webhooks/video-provider   -- recepción de callback
/lib
  auth.ts
  supabase.ts
  rls.ts
  providers/video.ts         -- adapter del proveedor
```

**Middleware**
- Inyectar `org_id` en JWT (al elegir organización).
- Comprobar rol antes de rutas sensibles.

---

## 13) Pantallas (MVP)

- **Dashboard Admin**
  - Saldo de créditos (org_wallets.balance).
  - Botón “Ajustar créditos” (abre modal para +/−).
  - Lista de proyectos con consumo mensual y límite.

- **Proyecto**
  - Tabla de videos: estado, fecha, autor, costo, acciones (ver/descargar).
  - Botón “Nuevo video”.

- **Nuevo video**
  - Selector de prompt:
    - Pestaña “Preconfigurados” (globales),
    - Pestaña “Desde cero”.
  - Área de edición de prompt (texto).
  - Parámetros mínimos: `duración (s)`, `aspect ratio (9:16, 1:1, 16:9)`.
  - Resumen de **costo** (X créditos).
  - Botón **Generar** (deshabilitado si sin créditos).

- **Detalle video**
  - Reproductor.
  - Metadata (prompt/version, parámetros, duración real, códec).
  - Botón Descargar.

- **Superadmin**
  - **Prompts globales**: listado y versión; crear/publicar.
  - **Ajustes globales**: créditos por video, máx. duración.

---

## 14) Métricas y analítica

- **Producto**
  - Videos generados por org/proyecto/miembro.
  - Tasa de éxito por proveedor.
  - Tiempo medio de generación.
  - Consumo de créditos por mes.
- **Sistema**
  - Errores de webhook.
  - Jobs atascados (`processing` > N min) → alerta.

---

## 15) Seguridad y cumplimiento

- **RLS** en todas las tablas; separación por `organization_id`.
- **Validación de rol** en serverless endpoints.
- **Webhooks** firmados + idempotencia.
- **PII mínima** (emails, nombres); cumplir derecho de eliminación.
- **Trazabilidad**: `audit_logs` (tabla adicional si se requiere granularidad).

```sql
create table public.audit_logs (
  id bigserial primary key,
  organization_id uuid,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

---

## 16) Plan de entrega (hitos)

1. **Semana 1:** Esquema DB + RLS + Auth + navegación base + Superadmin: settings/prompts (draft).
2. **Semana 2:** Organización/Proyectos/Members + Wallet + Ledger + UI Admin.
3. **Semana 3:** RPC `create_video_job_rpc` + flujo de generación (mock provider).
4. **Semana 4:** Integración proveedor real + Webhook + Storage + thumbnails + Detalle video.
5. **Semana 5:** Pulido UX, vacíos de seguridad, métricas básicas, documentación.

---

## 17) Roadmap próximo (post-slice)

- **Pagos** (Stripe) y paquetes de créditos.
- **Brand kits** y **templates** por empresa.
- **Prompts por organización** con versionado y permisos.
- **Editor ligero** (capas de texto/logo, cortes simples).
- **Moderación** automática (bloquear outputs sensibles).
- **A/B testing** de creatividades y reportes de performance.
- **Colaboración** (comentarios, aprobaciones).

---

## 18) Riesgos y mitigaciones

- **Proveedor de video inestable o lento** → abstracción con adapter, timeouts y reintentos, fallback a otro proveedor.
- **Inconsistencias de créditos** → transacción única, ledger auditable, utilidades de reconciliación.
- **RLS mal configurada** → tests automatizados de acceso cruzado (org A no ve datos de org B).
- **Jobs colgados** → watchdog que marca `failed` tras TTL y dispara reembolso (si aplica).

---

## 19) Decisiones pendientes

- Proveedor(es) de generación de video para el MVP (y límites técnicos: duración/fps/códec).
- Política de **reembolso** en fallos (automático vs. manual).
- Límite por proyecto **hard** (bloqueo en RPC) o **soft** (solo UI) — recomendado **hard**.
- Posible **tarifa variable** según duración o parámetros (por ahora **costo fijo**).

---

## 20) Checklist de aceptación (slice 1)

- [ ] Superadmin puede publicar prompts y ajustar costo por video.
- [ ] Admin crea org, proyecto, invita miembro, ajusta créditos.
- [ ] Miembro genera un video desde prompt global y desde cero.
- [ ] Créditos se **descuentan** al crear job; ledger registra el movimiento.
- [ ] Video final y thumbnail quedan en **Supabase Storage** y son descargables.
- [ ] Metadata (prompt + versión + parámetros) se guarda por video.
- [ ] RLS evita accesos cruzados entre organizaciones.
- [ ] Webhook idempotente y seguro.
- [ ] Logs y métricas básicas disponibles.

---

### ¿Qué necesitaría de ti para afinarlo y empezar a construir?

1. **Proveedor de video** preferido para el MVP (y formatos/duración objetivo).
2. **Costo por video** inicial (en créditos) y **duración máxima** permitida.
3. ¿El **límite por proyecto** debe ser **hard** en el RPC desde el día 1?
4. ¿Deseas **reembolso automático** al fallar un job en este slice?
5. ¿Idiomas/regiones objetivo** para prompts preconfigurados (es/pt/en)?  
6. ¿Algún **branding** mínimo (logo, paleta) para la UI inicial?

Si quieres, puedo convertir este PRD en **esquemas de migraciones SQL** para Supabase y **plantillas de páginas** en Next.js (app router) para arrancar hoy mismo.
