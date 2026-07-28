
export type EstadoHorario = 'LIBRE' | 'OCUPADO';

export interface Horario {
  id: number;
  fecha: string; 
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoHorario;
}

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA';
export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'RECHAZADO';

export interface Pago {
  id: number;
  monto: number;
  fecha_pago: string;
  estado: EstadoPago;
  metodo: string;
}

export interface Reserva {
  id: number;
  fecha_creacion: string;
  monto_total: number;
  estado: EstadoReserva;
  cancha_id: number;
  horario_id: number;
  usuario_id: number;
  pago?: Pago;
  calificacion?: Calificacion;
}

export interface ReservaAdminView {
  id: number;
  cancha_nombre: string;
  usuario_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  monto_total: number;
  estado: EstadoReserva;
  estado_pago: EstadoPago;
}

export interface Calificacion {
  id: number;
  puntaje: number;
  comentario: string;
  fecha: string;
  cancha_id: number;
  usuario_id: number;
  reserva_id: number;
}
