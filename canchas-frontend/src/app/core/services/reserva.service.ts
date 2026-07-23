import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Horario, Reserva, ReservaAdminView } from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private readonly baseUrl = `${environment.apiUrl}/canchas`;

  constructor(private http: HttpClient) {}

  obtenerDisponibilidad(canchaId: number, fecha: string): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.baseUrl}/${canchaId}/horarios`, {
      params: { fecha },
    });
  }

  reservar(canchaId: number, horarioId: number): Observable<Reserva> {
    return this.http.post<Reserva>(`${environment.apiUrl}/reservas`, {
      cancha_id: canchaId,
      horario_id: horarioId,
    });
  }

  listarMisReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${environment.apiUrl}/reservas`);
  }

  listarReservasAdmin(desde: string, hasta: string): Observable<ReservaAdminView[]> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ReservaAdminView[]>(`${environment.apiUrl}/admin/reservas`, { params });
  }
}
