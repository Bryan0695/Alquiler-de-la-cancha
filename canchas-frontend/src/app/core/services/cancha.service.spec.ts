import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Cancha } from '../models/cancha.model';
import { CanchaService } from './cancha.service';

const BASE = `${environment.apiUrl}/canchas`;

const CANCHA: Cancha = {
  id: 1,
  nombre: 'Cancha Norte',
  tipo: 'futbol5',
  precio_hora: 25,
  hora_apertura: '08:00',
  hora_cierre: '22:00',
  promedio_calificacion: 4.5,
  activa: true,
};

describe('CanchaService', () => {
  let service: CanchaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CanchaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('se instancia correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('listar', () => {
    it('hace GET a /canchas y devuelve la lista', () => {
      let resultado: Cancha[] | undefined;

      service.listar().subscribe((c) => (resultado = c));

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush([CANCHA]);

      expect(resultado).toEqual([CANCHA]);
    });

    it('propaga el error del backend', () => {
      let status: number | undefined;

      service.listar().subscribe({ error: (e) => (status = e.status) });
      httpMock.expectOne(BASE).flush(null, { status: 500, statusText: 'Server Error' });

      expect(status).toBe(500);
    });
  });

  describe('buscarPublicas', () => {
    it('no envía parámetros cuando no hay filtros', () => {
      service.buscarPublicas().subscribe();

      const req = httpMock.expectOne(`${BASE}/publicas`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toEqual([]);
      req.flush([]);
    });

    it('envía tipo y precio_max cuando se indican ambos filtros', () => {
      service.buscarPublicas({ tipo: 'futbol7', precioMax: 30 }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${BASE}/publicas`);
      expect(req.request.params.get('tipo')).toBe('futbol7');
      expect(req.request.params.get('precio_max')).toBe('30');
      req.flush([]);
    });

    it('omite el tipo cuando llega vacío', () => {
      service.buscarPublicas({ tipo: '', precioMax: 15 }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${BASE}/publicas`);
      expect(req.request.params.has('tipo')).toBeFalse();
      expect(req.request.params.get('precio_max')).toBe('15');
      req.flush([]);
    });

    it('conserva precio_max cuando vale 0 (no lo confunde con ausente)', () => {
      service.buscarPublicas({ precioMax: 0 }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${BASE}/publicas`);
      expect(req.request.params.get('precio_max')).toBe('0');
      req.flush([]);
    });

    it('omite precio_max cuando es undefined', () => {
      service.buscarPublicas({ tipo: 'futbol11', precioMax: undefined }).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${BASE}/publicas`);
      expect(req.request.params.has('precio_max')).toBeFalse();
      req.flush([]);
    });
  });

  describe('obtener', () => {
    it('hace GET a /canchas/:id', () => {
      let resultado: Cancha | undefined;

      service.obtener(7).subscribe((c) => (resultado = c));

      const req = httpMock.expectOne(`${BASE}/7`);
      expect(req.request.method).toBe('GET');
      req.flush({ ...CANCHA, id: 7 });

      expect(resultado?.id).toBe(7);
    });
  });

  describe('crear', () => {
    it('hace POST a /canchas con el cuerpo recibido', () => {
      const datos = {
        nombre: 'Cancha Sur',
        tipo: 'futbol7',
        precio_hora: 30,
        hora_apertura: '09:00',
        hora_cierre: '21:00',
      };

      service.crear(datos).subscribe();

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(datos);
      req.flush(CANCHA);
    });
  });

  describe('editar', () => {
    it('hace PUT a /canchas/:id con los campos parciales', () => {
      service.editar(3, { precio_hora: 40 }).subscribe();

      const req = httpMock.expectOne(`${BASE}/3`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ precio_hora: 40 });
      req.flush({ ...CANCHA, id: 3, precio_hora: 40 });
    });
  });

  describe('eliminar', () => {
    it('hace DELETE a /canchas/:id', () => {
      let mensaje: string | undefined;

      service.eliminar(5).subscribe((r) => (mensaje = r.mensaje));

      const req = httpMock.expectOne(`${BASE}/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ mensaje: 'Cancha eliminada' });

      expect(mensaje).toBe('Cancha eliminada');
    });

    it('propaga el 409 cuando la cancha tiene reservas activas', () => {
      let status: number | undefined;

      service.eliminar(5).subscribe({ error: (e) => (status = e.status) });
      httpMock.expectOne(`${BASE}/5`).flush(null, { status: 409, statusText: 'Conflict' });

      expect(status).toBe(409);
    });
  });
});
