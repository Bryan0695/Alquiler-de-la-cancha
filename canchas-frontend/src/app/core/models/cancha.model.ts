
export interface Cancha {
  id: number;
  nombre: string;
  tipo: string;
  precio_hora: number;
  hora_apertura: string; 
  hora_cierre: string; 
  promedio_calificacion: number;
  activa: boolean;
}

export interface CanchaCreateRequest {
  nombre: string;
  tipo: string;
  precio_hora: number;
  hora_apertura: string;
  hora_cierre: string;
}

export type CanchaUpdateRequest = Partial<CanchaCreateRequest>;

export const TIPOS_CANCHA = ['futbol5', 'futbol7', 'futbol11'] as const;
