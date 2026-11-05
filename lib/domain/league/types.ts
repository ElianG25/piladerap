export type EventStatus =
  | "futura"
  | "anunciada"
  | "inscripciones"
  | "en_vivo"
  | "finalizada"
  | "oculta";

export type LeagueEvent = {
  eventId: string;
  numero: number;
  titulo: string;
  label: string;
  estado: EventStatus;
  fechaEvento: string;
  horaEvento: string;
  ubicacion: string;
  maxCupos: number;
  campeon: string;
  subcampeon: string;
  mvp: string;
  resumen: string;
  youtubePlaylist: string;
  inscripcionesAbiertas: boolean;
  visible: boolean;
  orden: number;
  /** Portada de la playlist de la fecha (foto grupal). La agrega el servidor; no viene de la hoja. */
  coverUrl?: string;
};

export type RankingItem = {
  alias: string;
  puntosLiga: number;
  victorias: number;
  derrotas: number;
  replicas: number;
  bonus: number;
  estado: string;
  ultimaFecha: string;
  movimiento: string;
};

/** Fila de la tabla ya ordenada: posición (con empates compartidos) y si quedó empatada sin cruce directo. */
export type RankedItem = RankingItem & {
  posicion: number;
  empatado: boolean;
};

export type Battle = {
  battleId: string;
  eventId: string;
  orden: number;
  ronda: string;
  grupo: string;
  mc1: string;
  mc2: string;
  mc3: string;
  mc4: string;
  ganador: string;
  perdedor: string;
  youtubeUrl: string;
  estado: string;
  tipoResultado: string;
  cuentaParaLiga: boolean;
  puntosMc1: number;
  puntosMc2: number;
  notas: string;
};

export type Registration = {
  createdAt: string;
  eventId: string;
  nombre: string;
  alias: string;
  telefono: string;
  instagram: string;
  estado: string;
  source: string;
};

export type MediaItem = {
  eventId: string;
  tipo: string;
  titulo: string;
  url: string;
  visible: boolean;
  orden: number;
};

export type LeaguePayload = {
  config: Record<string, string>;
  activeEvent: LeagueEvent | null;
  featuredEvent: LeagueEvent | null;
  latestCompletedEvent: LeagueEvent | null;
  events: LeagueEvent[];
  registrations: Registration[];
  participants: unknown[];
  ranking: RankingItem[];
  battles: Battle[];
  media: MediaItem[];
  capacity: {
    total: number;
    restantes: number;
    max: number;
  };
};
