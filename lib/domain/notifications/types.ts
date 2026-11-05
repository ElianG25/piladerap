export type NotificationKind =
  | "event_announced"
  | "registration_open"
  | "low_capacity"
  | "event_live"
  | "champion_crowned"
  | "new_video"
  | "ranking_shuffle"
  | "results_finalized"
  | "mc_result"
  | "event_reminder";

export type NotificationEvent = {
  kind: NotificationKind;
  title: string;
  body: string;
  /** Ruta relativa a la que debe llevar un tap sobre la notificación. */
  url: string;
  /**
   * Si viene, el aviso solo es para quienes siguen a alguno de estos MCs
   * (alias en minúsculas). Sin esto, le llega a todas las suscripciones.
   */
  audience?: { aliases: string[] };
};

export type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};
