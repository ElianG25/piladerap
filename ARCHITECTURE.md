# Arquitectura

Este documento describe cómo está organizado el código después del refactor a
arquitectura limpia. El comportamiento de la app no cambió — lo que cambió es
dónde vive cada responsabilidad y quién depende de quién.

## Principio general

```
app/   → Next.js. Routing, HTTP, React, hooks de UI. "Cómo se entrega."
lib/   → Framework-agnóstico. Dominio, casos de uso, integraciones externas. "Qué hace la app."
```

`app/` puede importar de `lib/`. `lib/` nunca importa de `app/`, ni de React,
ni de Next — así el núcleo del negocio no depende de cómo se sirve (hoy es
Next.js; si algún día cambia, `lib/` no se entera).

## Estructura de carpetas

```
lib/
  domain/league/              Reglas y tipos puros — cero I/O, cero framework.
    types.ts                    Entidades: LeagueEvent, RankingItem, Battle, LeaguePayload...
    rules.ts                    getPublicEvents, getPublishedBattles, getEventPlaylistUrl, isSectionEnabled, hasPendingResults
    ranking.ts                  rankLeague: orden por puntos de liga + desempate por cruce directo (empate = posición compartida)
    scoring.ts                  Reglas de puntos: victoria directa 3 / con réplica 2 / derrota con réplica 1 / directa 0
    rounds.ts                   Orden de rondas (Octavos → Final), agrupar por ronda, encontrar la Final de una fecha
    profile.ts                  Batallas y récord de un MC (ficha de MC)
    standings.ts                Puntos por fecha, movimiento en la tabla con la última fecha, historial de un MC
    headToHead.ts               Rivales de un MC y cara a cara entre dos
    records.ts                  Récords de la temporada y salón de campeones
    mcPhoto.ts                  mcSlug(alias): nombre del archivo de la foto de un MC
    dataHealth.ts               Validador: revisa que las hojas sean coherentes entre sí (/revision-datos)
    registrationErrors.ts       Códigos de error de inscripción ↔ status HTTP ↔ mensaje de usuario
                                 (única fuente — antes duplicado entre la API y el formulario)
    eventTime.ts                 Combina fechaEvento + horaEvento (12h/24h) en un Date real

  domain/notifications/       Puro también: decide QUÉ notificar, sin fetch ni Date.now().
    types.ts                    NotificationEvent, NotificationKind, PushSubscriptionData
    diffLeague.ts                Compara snapshot anterior vs actual → NotificationEvent[]
    isEventToday.ts               ¿"fechaEvento" es hoy? (para el recordatorio del día)
    followedMcs.ts                Avisos por MC (ganó / cayó / campeón) para quienes lo siguen
    audience.ts                   Qué avisos le tocan a cada suscripción (generales + los de sus MCs)

  application/league/         Casos de uso — orquestan dominio + infraestructura.
    getLeague.ts                 Trae y valida la liga completa (usado por /api/league y /api/og)
    attachPlaylistCovers.ts      Le agrega a cada fecha la portada (foto grupal) de su playlist de YouTube
    registerParticipant.ts       Registra un participante y dispara la notificación
    buildShareHighlights.ts      Elige qué mostrar en la imagen social (fecha destacada, top 3...)

  application/notifications/  Casos de uso de push.
    checkForUpdatesAndNotify.ts   Trae la liga, la compara contra el snapshot, notifica, guarda snapshot
    manageSubscription.ts         Alta/baja de una suscripción push

  infrastructure/              Todo lo que toca el mundo exterior.
    sheets/
      sheetsClient.ts            Único lugar que lee SHEETS_GET_URL y hace fetch a Apps Script
      payloadMapper.ts            zod: valida/normaliza el JSON crudo de Sheets → tipos de dominio
    youtube/
      playlistCover.ts             Lee la portada firmada de una playlist (og:image) en streaming; cache en memoria 6 h
    telegram/
      telegramNotifier.ts        Notificación best-effort de inscripciones
    security/
      rateLimiter.ts              Anti-spam por IP en Redis (ventana fija, falla abierto)
      honeypot.ts                  Detección de bots por campo oculto
    push/
      webPushClient.ts             Envía vía web-push (VAPID); distingue suscripción muerta vs error transitorio
      subscriptionStore.ts          Redis (Upstash): suscripciones, a qué MCs sigue cada una, snapshot de la liga, dedup del recordatorio diario

  shared/
    format.ts                    initials, formatPoints (medios puntos), formatEventDate
    youtube.ts                   ID y portadas de YouTube, asHttpUrl (descarta texto suelto de la hoja)
    calendar.ts                  .ics de una fecha + enlace a Google Maps

app/
  api/
    league/route.ts             Adaptador HTTP delgado: parsea el request, llama a application/,
                                 traduce el resultado a NextResponse + status code
    og/route.tsx                 Adaptador HTTP + JSX: llama a getLeague()/buildShareHighlights(),
                                 renderiza la imagen
    push/subscribe/route.ts      Alta (POST) / baja (DELETE) de una suscripción push
    push/follow/route.ts         Guarda a qué MCs sigue una suscripción
    cron/check-updates/route.ts  Disparado por Vercel Cron ~6x/día (vercel.json); protegido con CRON_SECRET

  # Además de /api: calendario.ics (calendario suscribible), pantalla (modo proyector), mc/[alias] y fecha/[id]
  # (enlaces compartibles con su tarjeta), revision-datos (validador, solo con la llave del cron).

  hooks/                        Estado y efectos del lado del cliente (React puro, sin JSX de página).
    useLeagueData.ts             Fetch inicial + auto-refresh de la liga
    useSectionRouter.ts          Sección activa, secciones visibles según Config, URL, swipe
    useEventCountdown.ts         Cuenta regresiva hacia la fecha destacada
    useModalLayer.ts             Foco atrapado, Escape por capas y scroll bloqueado de los diálogos
    useFollows.ts                MCs que sigue esta persona (guardados en el teléfono; se sincronizan con el servidor si hay avisos)
    useMediaQuery.ts             Suscripción genérica a media queries
    useParallaxScrollY.ts        Offset de scroll para el parallax del fondo
    usePushSubscription.ts       Soporte/permiso/suscripción push del navegador (detecta iOS sin instalar)

  lib/
    leagueClient.ts              fetch del navegador hacia nuestra propia API (no hacia Sheets)

  components/
    home/                        HomeView (barra superior + navegación + secciones), LoadingScreen, ErrorScreen, NavIcon
    league/                      LeagueHero (campeón + foto de la final / cuenta regresiva / en vivo), Scoreboard (ranking),
                                 McProfileSheet (ficha de MC), BattleArchive (llaves por fecha), EventTimeline, LatestBattles,
                                 RegistrationCard, ScoringRules, SeasonExtras (récords + salón), OverlayProvider (ficha y video únicos,
                                 enlaces ?mc= / ?batalla=), VideoModal, HeroVideo (video de fondo solo en equipos capaces),
                                 EventActions, EventStatusBadge
    notifications/
      NotificationBell.tsx         Campana en la barra (activar/desactivar; instrucciones en iOS sin instalar)
      NotificationBanner.tsx        Aviso cerrable de opt-in en la home
    ui/                          McPhoto (foto del MC o iniciales), icons (SVG propios), PilaMark (logo recortado), YouTubeThumb (portadas), buttons (clases)
    ServiceWorkerRegistration.tsx

public/
  sw.js                          Cache-first/network-first de siempre + listeners de push/notificationclick

  page.tsx                      Composition root: llama a los hooks, deriva selectores de dominio
                                 (sortRanking, getPublicEvents...) y delega el render a <HomeView/>.
                                 ~50 líneas — antes tenía ~590 mezclando fetch, estado, routing y JSX.
```

## Flujo de datos

**Lectura (home → Sheets):**
```
HomeView (props)
  ← page.tsx (composition root)
    ← useLeagueData()            [app/hooks]
      ← fetchLeague()            [app/lib/leagueClient.ts]  — fetch("/api/league")
        ← GET /api/league        [app/api/league/route.ts]  — adaptador HTTP
          ← getLeague()          [lib/application/league]   — caso de uso
            ← fetchLeaguePayloadRaw() [lib/infrastructure/sheets/sheetsClient.ts]
            ← adaptPayload()     [lib/infrastructure/sheets/payloadMapper.ts]  — zod
```

**Escritura (inscripción):**
```
RegistrationCard (POST /api/league)
  → app/api/league/route.ts       — honeypot, rate-limit, validación de forma
    → registerParticipant()       [lib/application/league]
      → submitRegistrationRaw()   [lib/infrastructure/sheets/sheetsClient.ts]
      → notifyRegistration()      [lib/infrastructure/telegram/telegramNotifier.ts] (fire-and-forget)
```

**Imagen social:**
```
GET /api/og
  → getLeague()               [lib/application/league]     (mismo caso de uso que /api/league)
  → buildShareHighlights()    [lib/application/league]     — deriva qué mostrar
  → JSX + ImageResponse       [app/api/og/route.tsx]        — presentación, edge runtime
```

**Notificaciones push (cron ~6x/día — ver límite de Hobby abajo):**
```
Vercel Cron → GET /api/cron/check-updates (Authorization: Bearer CRON_SECRET)
  → checkForUpdatesAndNotify()      [lib/application/notifications]
    → getLeague(0)                  [lib/application/league]              — liga fresca
    → getLastSnapshot()             [lib/infrastructure/push/subscriptionStore.ts]
    → diffLeagueForNotifications()  [lib/domain/notifications/diffLeague.ts]  — puro
    → isEventToday() + hasBeenRemindedToday()/markRemindedToday()  — recordatorio del día (dedup)
    → sendPushToSubscription()      [lib/infrastructure/push/webPushClient.ts]  — por cada suscripción
    → saveSnapshot()                — la liga actual pasa a ser la base de la próxima comparación
```
Suscribirse: `usePushSubscription` (hook) → `pushManager.subscribe()` (navegador) → `POST /api/push/subscribe` → `subscribeToPush()` [lib/application/notifications/manageSubscription.ts] → Redis.

## Por qué esta separación (y no otra)

- **`sheetsClient.ts` es el único lugar que lee `SHEETS_GET_URL`.** Antes ese env var se leía por
  separado en `api/league/route.ts` y `api/og/route.tsx`. Si el backend cambia de transporte, se
  toca un solo archivo.
- **`registrationErrors.ts` es la única fuente de códigos de error.** Antes `getErrorStatus()`
  (servidor) y `ERR_MAP` (cliente) mantenían la misma lista de códigos por separado; un código nuevo
  del backend obligaba a recordar tocar los dos lados.
- **Los casos de uso (`application/`) no conocen `NextResponse` ni JSX.** Devuelven datos o lanzan
  errores tipados (`SheetsConfigError`, `SheetsUnavailableError`, `SheetsInvalidResponseError`); el
  adaptador HTTP decide el status code. Esto es lo que permite que `getLeague()` sirva tanto a
  `/api/league` (JSON) como a `/api/og` (imagen) sin duplicar la lógica de fetch+validación.
- **`domain/` no importa nada de `app/` ni de Next.** `rules.ts` y `types.ts` son funciones y tipos
  puros; se testean sin arrancar un servidor y se podrían reusar tal cual si el frontend cambiara de
  framework.
- **`page.tsx` ya no hace fetch ni maneja efectos.** Cada preocupación de la home vive en su propio
  hook (`useLeagueData`, `useSectionRouter`, `useEventCountdown`, `useMediaQuery`,
  `useParallaxScrollY`), y `HomeView` es una función pura de sus props — se puede razonar sobre cada
  pieza por separado, y un cambio en, por ejemplo, la lógica de countdown no puede romper el fetch de
  datos por accidente.

## Límites conocidos (no resueltos por este refactor)

- **`rateLimiter.ts` ya usa Redis (Upstash)** — se migró del Map en memoria original ni bien se
  agregó Upstash para las notificaciones push. Es una ventana fija (no deslizante como el Map
  original) y falla abierto si Redis no responde; suficiente para anti-spam best-effort.
- **El contrato de error sigue siendo por convención**, no por tipos compartidos con el Apps Script
  (`google-apps-scripts.gs`). `registrationErrors.ts` es la única fuente en el lado Next.js, pero el
  `.gs` define sus propios strings de error de forma independiente; si cambian ahí, hay que
  actualizar `registrationErrors.ts` a mano.
- **`Battle.mc1..mc4`** sigue siendo campos fijos en vez de `competitors: string[]` — cambiarlo
  implica coordinar también el contrato del Apps Script, fuera del alcance de un refactor de solo
  Next.js.
- **Vercel Cron en plan Hobby (free) rechaza el deploy si un cron corre más de una vez al día**
  (confirmado: así fue como se rompió el primer intento de este feature — `*/5 * * * *` hizo fallar
  el deploy en Vercel). La solución actual son 6 cron jobs en `vercel.json`, cada uno "una vez al
  día" a una hora distinta, dando ~4h de latencia máxima en vez de 5 min. Con plan Pro se puede
  volver a un solo `*/5 * * * *`.
- **Push en iOS requiere la PWA instalada** (Compartir → Agregar a inicio) e iOS 16.4+; en Safari
  normal las APIs de push no están disponibles. `usePushSubscription` detecta este caso
  (`ios_needs_install`) y la UI muestra instrucciones en vez de un botón que fallaría en silencio.
- **Las notificaciones son broadcast, no personalizadas** — todo suscrito recibe todo. Personalizar
  por alias de MC (p. ej. "te pasaron en el ranking") requeriría pedir el alias al suscribirse y
  cruzarlo contra `ranking.alias`, que hoy no se guarda por suscripción.

## Fotos de MCs

Las originales van en `fotos-mcs/` (no se suben a git). `npm run fotos` las reduce a 480×480 JPEG
(~30–50 KB), las guarda en `public/mcs/<mcSlug>.jpg` y regenera `lib/generated/mcPhotos.ts` con la
lista disponible. La web solo pide la foto cuando se abre la ficha de ese MC (carga diferida), y la
sirve la CDN como archivo estático: no pasa por funciones del servidor. `/revision-datos` avisa de
fotos cuyo nombre no coincide con ningún MC.
