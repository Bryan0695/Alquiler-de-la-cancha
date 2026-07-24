import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReservaAdminView } from '../../../core/models/reserva.model';
import { ReservaService } from '../../../core/services/reserva.service';
import { ReservasAdmin } from './reservas-admin';

const VISTA: ReservaAdminView = {
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

const DIA_MS = 24 * 60 * 60 * 1000;

describe('ReservasAdmin', () => {
  let fixture: ComponentFixture<ReservasAdmin>;
  let componente: ReservasAdmin;
  let reservaService: jasmine.SpyObj<Pick<ReservaService, 'listarReservasAdmin'>>;

  beforeEach(async () => {
    reservaService = jasmine.createSpyObj('ReservaService', ['listarReservasAdmin']);
    reservaService.listarReservasAdmin.and.returnValue(of([VISTA]));

    TestBed.configureTestingModule({
      imports: [ReservasAdmin],
      providers: [{ provide: ReservaService, useValue: reservaService }],
    });

    TestBed.overrideComponent(ReservasAdmin, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ReservasAdmin);
    componente = fixture.componentInstance;
  });

  it('se crea con un rango por defecto de los últimos 30 días', () => {
    expect(componente).toBeTruthy();

    const diferenciaDias = Math.round(
      (componente.hasta().getTime() - componente.desde().getTime()) / DIA_MS,
    );
    expect(diferenciaDias).toBe(30);
    expect(componente.reservas()).toEqual([]);
    expect(componente.cargando()).toBeFalse();
    expect(componente.error()).toBeNull();
  });

  describe('ngOnInit', () => {
    it('busca las reservas al iniciar', () => {
      componente.ngOnInit();

      expect(reservaService.listarReservasAdmin).toHaveBeenCalledTimes(1);
      expect(componente.reservas()).toEqual([VISTA]);
    });
  });

  describe('buscar', () => {
    it('convierte el rango a ISO local (aISO) antes de consultar', () => {
      componente.desde.set(new Date(2026, 0, 3));
      componente.hasta.set(new Date(2026, 11, 25));

      componente.buscar();

      expect(reservaService.listarReservasAdmin).toHaveBeenCalledOnceWith(
        '2026-01-03',
        '2026-12-25',
      );
    });

    it('guarda los resultados y apaga el indicador de carga', () => {
      componente.buscar();

      expect(componente.reservas()).toEqual([VISTA]);
      expect(componente.cargando()).toBeFalse();
      expect(componente.error()).toBeNull();
    });

    it('muestra el mensaje de endpoint faltante si la consulta falla', () => {
      reservaService.listarReservasAdmin.and.returnValue(throwError(() => ({ status: 404 })));

      componente.buscar();

      expect(componente.cargando()).toBeFalse();
      expect(componente.error()).toContain('listarReservasAdmin');
      expect(componente.reservas()).toEqual([]);
    });

    it('limpia el error anterior en una nueva búsqueda', () => {
      componente.error.set('error viejo');

      componente.buscar();

      expect(componente.error()).toBeNull();
    });
  });

  describe('severidadPago', () => {
    it('devuelve success para PAGADO', () => {
      expect(componente.severidadPago('PAGADO')).toBe('success');
    });

    it('devuelve danger para RECHAZADO', () => {
      expect(componente.severidadPago('RECHAZADO')).toBe('danger');
    });

    it('devuelve warn para PENDIENTE', () => {
      expect(componente.severidadPago('PENDIENTE')).toBe('warn');
    });

    it('devuelve warn ante un estado desconocido', () => {
      expect(componente.severidadPago('CUALQUIER_COSA')).toBe('warn');
    });
  });
});
