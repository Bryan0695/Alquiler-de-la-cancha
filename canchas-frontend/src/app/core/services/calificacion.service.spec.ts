import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Calificacion } from '../models/reserva.model';
import { CalificacionService } from './calificacion.service';

const CALIFICACION: Calificacion = {
  id: 4,
  puntaje: 5,
  comentario: 'Excelente cancha',
  fecha: '2026-07-24',
  cancha_id: 1,
  usuario_id: 3,
  reserva_id: 99,
};

describe('CalificacionService', () => {
  let service: CalificacionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CalificacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('se instancia correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('calificar', () => {
    it('hace POST a /canchas/:id/calificaciones con el cuerpo esperado', () => {
      let resultado: Calificacion | undefined;

      service.calificar(1, 99, 5, 'Excelente cancha').subscribe((c) => (resultado = c));

      const req = httpMock.expectOne(`${environment.apiUrl}/canchas/1/calificaciones`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        reserva_id: 99,
        puntaje: 5,
        comentario: 'Excelente cancha',
      });
      req.flush(CALIFICACION);

      expect(resultado).toEqual(CALIFICACION);
    });

    it('acepta un comentario vacío', () => {
      service.calificar(2, 100, 3, '').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/canchas/2/calificaciones`);
      expect(req.request.body).toEqual({ reserva_id: 100, puntaje: 3, comentario: '' });
      req.flush({ ...CALIFICACION, comentario: '' });
    });

    it('propaga el error cuando la reserva ya fue calificada', () => {
      let status: number | undefined;

      service.calificar(1, 99, 5, 'otra vez').subscribe({ error: (e) => (status = e.status) });
      httpMock
        .expectOne(`${environment.apiUrl}/canchas/1/calificaciones`)
        .flush(null, { status: 409, statusText: 'Conflict' });

      expect(status).toBe(409);
    });
  });
});
