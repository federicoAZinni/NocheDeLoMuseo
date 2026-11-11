export interface Stand {
  id: string;
  nombre: string;
  orden: number;
  imagen?: string;
}

export interface Usuario {
  uid: string;
  nombre: string;
  dni: string;
}

export interface Figurita {
  clave: string;
  fecha: unknown;
}

export interface Ganador {
  id: string;
  uid: string;
  nombre: string;
  dni: string;
  fecha: unknown;
}

export interface ParticipanteFila extends Usuario {
  hechas: number;
  completo: boolean;
}

export type RuletaItem = Pick<ParticipanteFila, "uid" | "nombre" | "dni">;
