import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Calificacion } from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class CalificacionService {
  constructor(private http: HttpClient) {}

  calificar(
    canchaId: number,
    reservaId: number,
    puntaje: number,
    comentario: string,
  ): Observable<Calificacion> {
    return this.http.post<Calificacion>(`${environment.apiUrl}/canchas/${canchaId}/calificaciones`, {
      reserva_id: reservaId,
      puntaje,
      comentario,
    });
  }
}
