# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fans y MCs del freestyle de plaza en República Dominicana, casi siempre desde el teléfono (PWA instalable, notificaciones push). Los usan antes de una fecha (¿cuándo, dónde, cómo me inscribo?), durante (¿quién sigue?, ver en vivo) y después (ranking, videos de las batallas, quién ganó). [Inferido del código y del uso descrito; los patrocinadores no están confirmados como audiencia.]

## Product Purpose

Pila de Ra' es una liga de freestyle que compite en plazas de Santo Domingo. El sitio es su marcador oficial y su archivo: ranking de la temporada, fechas, batallas con video, inscripción y avisos push. El éxito es que cualquier persona entienda en segundos quién va ganando, qué viene y dónde ver las batallas.

## Positioning

Una liga con reglas claras (puntos por victoria directa/réplica, desempate por cruce directo) que nace en la calle: plaza, círculo de gente, medallas rojas, videos en YouTube y clips en Instagram. "Vamo' a prender la plaza." El logo es una pila (batería) amarilla con rayo.

## Operating Context

- Las fechas se juegan en plazas (Plaza Revolución Héroes de Abril – UASD, cerca de la estación Casandra Damirón). Las fotos y videos muestran tarde y noche al aire libre.
- Eliminación directa por fecha: Octavos, Cuartos, Semifinal, Tercer puesto, Final. Una batalla puede definirse directa o con réplica.
- Puntos de liga: victoria directa 3, victoria con réplica 2, derrota con réplica 1, derrota directa 0. La batalla por el tercer puesto no da esos puntos: el que gana suma 1 punto extra (columna `bonus`, ya incluido en `puntosLiga`) y esa batalla no cuenta como victoria, derrota ni réplica en el récord. Se quitaron los puntos de jurado (`puntosBatalla`) porque cada jurado puntúa con criterio distinto.
- El tercer puesto no tiene video propio: se juega dentro de la primera ronda del video de la Final. En `Batallas` se deja `youtubeUrl` en blanco y la web usa el video de la Final de esa fecha (`videoCompartido`), avisándolo en la tarjeta. Si se pega un enlace propio (p. ej. con `&t=` al minuto), ese manda. No genera aviso push de "video nuevo".
- Desempate: cruce directo entre los empatados; si no existe, el empate se mantiene.
- Backend: Google Sheets (Config, Eventos, Ranking, Batallas, Participantes, Inscripciones, Media) vía Google Apps Script. El Excel/Sheet se digita a mano. La Fecha 1 no tiene batallas respaldadas: los videos de ese día se perdieron, y sus puntos y récords en `Ranking` se cargaron y corrigieron a mano con los registros de los jurados. No hay forma de verificarlos contra videos, así que `Ranking` es la verdad para esa fecha (la web no los contrasta con `Batallas`).

## Capabilities and Constraints

- Next.js 16 / React 19, Tailwind 4, Framer Motion, Upstash Redis + Vercel Cron (plan Hobby), web-push. Dominio puro en `lib/domain`, casos de uso en `lib/application`, I/O en `lib/infrastructure`.
- Fuente de verdad del ranking: hoja `Ranking`. Hay medios puntos heredados de un sistema de votación primitivo en la Fecha 1 (se conservan tal cual).
- Inscripción hoy es presencial (`registrationMode`).

## Brand Commitments

- Nombre: Pila de Ra'. Eslogan: "Vamo' a prender la plaza".
- Logo: `public/logo.png`, pila amarilla en bloques con rayo. Amarillo de marca. Rotulado de video: amarillo condensado pesado sobre foto.
- Tono: callejero, de plaza, dominicano. Instagram: @piladera. YouTube: @Piladerap.
- Dirección visual pedida por el dueño: híbrido entre "cartel de calle" y "marcador profesional".

## Evidence on Hand

- Videos de todas las batallas de las Fechas 2–4 en YouTube, con portadas (fotos reales de cada batalla). Playlists públicas de cada fecha. Clips en Instagram.
- Fotos grupales de cada fecha dentro de las playlists. No hay fotos locales en el repo.
- No inventar: patrocinadores, cifras de audiencia, premios.

## Product Principles

1. El marcador manda: el ranking y los resultados se leen en un vistazo, sin adornos.
2. La calle es el contenido: las fotos y videos reales de las plazas son el protagonista, no un fondo genérico.
3. Reglas visibles: el sitio explica cómo se ganan los puntos y por qué alguien va primero.
4. Un dato a medias se dice a medias: si algo está pendiente o provisional, la interfaz lo declara.
5. Teléfono primero, a pleno sol y de noche.

## Accessibility & Inclusion

Contraste AA mínimo, objetivos táctiles ≥44px, respetar `prefers-reduced-motion`, español dominicano natural.
