import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Horario, Reserva, ReservaAdminView } from '../models/reserva.model';
import { ReservaService } from './reserva.service';

const HORARIO: Horario = {
  id: 10,
  fecha: '2026-07-24',
  hora_inicio: '18:00',
  hora_fin: '19:00',
  estado: 'LIBRE',
};

const RESERVA: Reserva = {
  id: 99,
  fecha_creacion: '2026-07-24T10:00:00',
  monto_total: 25,
  estado: 'CONFIRMADA',
  cancha_id: 1,
  horario_id: 10,
  usuario_id: 3,
};

describe('ReservaService', () => {
  let service: ReservaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReservaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('se instancia correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('obtenerDisponibilidad', () => {
    it('hace GET a /canchas/:id/horarios con la fecha como parámetro', () => {
      let horarios: Horario[] | undefined;

      service.obtenerDisponibilidad(1, '2026-07-24').subscribe((h) => (horarios = h));

      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/canchas/1/horarios`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('fecha')).toBe('2026-07-24');
      req.flush([HORARIO]);

      expect(horarios).toEqual([HORARIO]);
    });

    it('propaga el error cuando el endpoint no responde', () => {
      let status: number | undefined;

      service.obtenerDisponibilidad(1, '2026-07-24').subscribe({ error: (e) => (status = e.status) });
      httpMock
        .expectOne((r) => r.url === `${environment.apiUrl}/canchas/1/horarios`)
        .flush(null, { status: 404, statusText: 'Not Found' });

      expect(status).toBe(404);
    });
  });

  describe('reservar', () => {
    it('hace POST a /reservas con cancha_id y horario_id en snake_case', () => {
      let creada: Reserva | undefined;

      service.reservar(1, 10).subscribe((r) => (creada = r));

      const req = httpMock.expectOne(`${environment.apiUrl}/reservas`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ cancha_id: 1, horario_id: 10 });
      req.flush(RESERVA);

      expect(creada).toEqual(RESERVA);
    });

    it('propaga el 409 cuando el horario ya fue tomado', () => {
      let status: number | undefined;

      service.reservar(1, 10).subscribe({ error: (e) => (status = e.status) });
      httpMock
        .expectOne(`${environment.apiUrl}/reservas`)
        .flush(null, { status: 409, statusText: 'Conflict' });

      expect(status).toBe(409);
    });
  });

  describe('listarMisReservas', () => {
    it('hace GET a /reservas', () => {
      let reservas: Reserva[] | undefined;

      service.listarMisReservas().subscribe((r) => (reservas = r));

      const req = httpMock.expectOne(`${environment.apiUrl}/reservas`);
      expect(req.request.method).toBe('GET');
      req.flush([RESERVA]);

      expect(reservas).toEqual([RESERVA]);
    });
  });

  describe('listarReservasAdmin', () => {
    it('hace GET a /admin/reservas con el rango desde/hasta', () => {
      const vista: ReservaAdminView = {
        id: 99,
        cancha_nombre: 'Cancha Norte',
        usuario_nombre: 'Ana',
        fecha: '2026-07-24',
        hora_inicio: '18:00',
        hora_fin: '19:00',
        monto_total: 25,
        estado: 'CONFIRMADA',
        estado_pago: 'PAGADO',
      };
      let resultado: ReservaAdminView[] | undefined;

      service.listarReservasAdmin('2026-06-24', '2026-07-24').subscribe((r) => (resultado = r));

      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/admin/reservas`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('desde')).toBe('2026-06-24');
      expect(req.request.params.get('hasta')).toBe('2026-07-24');
      req.flush([vista]);

      expect(resultado).toEqual([vista]);
    });
  });
});
