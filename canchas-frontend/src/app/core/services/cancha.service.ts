import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Cancha,
  CanchaCreateRequest,
  CanchaUpdateRequest,
} from '../models/cancha.model';
import { MensajeResponse } from '../models/common.model';

@Injectable({ providedIn: 'root' })
export class CanchaService {
  private readonly baseUrl = `${environment.apiUrl}/canchas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Cancha[]> {
    return this.http.get<Cancha[]>(this.baseUrl);
  }

  buscarPublicas(filtros?: { tipo?: string; precioMax?: number }): Observable<Cancha[]> {
    let params = new HttpParams();
    if (filtros?.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros?.precioMax != null) params = params.set('precio_max', filtros.precioMax);
    return this.http.get<Cancha[]>(`${this.baseUrl}/publicas`, { params });
  }

  obtener(id: number): Observable<Cancha> {
    return this.http.get<Cancha>(`${this.baseUrl}/${id}`);
  }

  crear(datos: CanchaCreateRequest): Observable<Cancha> {
    return this.http.post<Cancha>(this.baseUrl, datos);
  }

  editar(id: number, datos: CanchaUpdateRequest): Observable<Cancha> {
    return this.http.put<Cancha>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.baseUrl}/${id}`);
  }
}
