export type Rol = 'JUGADOR' | 'ADMINISTRADOR';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
}
