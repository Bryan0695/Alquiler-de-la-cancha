import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { Cancha } from '../../../core/models/cancha.model';
import { Calificacion, Reserva } from '../../../core/models/reserva.model';
import { CalificacionService } from '../../../core/services/calificacion.service';
import { CanchaService } from '../../../core/services/cancha.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { ReservasList } from './reservas-list';

function cancha(id: number, nombre: string): Cancha {
  return {
    id,
    nombre,
    tipo: 'futbol5',
    precio_hora: 25,
    hora_apertura: '08:00',
    hora_cierre: '22:00',
    promedio_calificacion: 4,
    activa: true,
  };
}

function reserva(id: number, canchaId: number, extra: Partial<Reserva> = {}): Reserva {
  return {
    id,
    fecha_creacion: '2026-07-24T10:00:00',
    monto_total: 25,
    estado: 'CONFIRMADA',
    cancha_id: canchaId,
    horario_id: id * 10,
    usuario_id: 3,
    ...extra,
  };
}

const CALIFICACION: Calificacion = {
  id: 4,
  puntaje: 5,
  comentario: 'Excelente',
  fecha: '2026-07-24',
  cancha_id: 1,
  usuario_id: 3,
  reserva_id: 1,
};

describe('ReservasList', () => {
  let fixture: ComponentFixture<ReservasList>;
  let componente: ReservasList;
  let reservaService: jasmine.SpyObj<Pick<ReservaService, 'listarMisReservas'>>;
  let canchaService: jasmine.SpyObj<Pick<CanchaService, 'obtener'>>;
  let calificacionService: jasmine.SpyObj<Pick<CalificacionService, 'calificar'>>;
  let messageService: jasmine.SpyObj<Pick<MessageService, 'add'>>;

  beforeEach(async () => {
    reservaService = jasmine.createSpyObj('ReservaService', ['listarMisReservas']);
    canchaService = jasmine.createSpyObj('CanchaService', ['obtener']);
    calificacionService = jasmine.createSpyObj('CalificacionService', ['calificar']);
    messageService = jasmine.createSpyObj('MessageService', ['add']);

    reservaService.listarMisReservas.and.returnValue(of([reserva(1, 1), reserva(2, 2)]));
    canchaService.obtener.and.callFake((id: number) =>
      of(cancha(id, id === 1 ? 'Cancha Norte' : 'Cancha Sur')),
    );
    calificacionService.calificar.and.returnValue(of(CALIFICACION));

    TestBed.configureTestingModule({
      imports: [ReservasList],
      providers: [
        { provide: ReservaService, useValue: reservaService },
        { provide: CanchaService, useValue: canchaService },
        { provide: CalificacionService, useValue: calificacionService },
        { provide: MessageService, useValue: messageService },
      ],
    });

    // `providers: []` retira el MessageService propio del componente para que
    // se resuelva el espía registrado en el TestBed.
    TestBed.overrideComponent(ReservasList, { set: { template: '', providers: [] } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ReservasList);
    componente = fixture.componentInstance;
  });

  it('se crea con la lista vacía y sin diálogos abiertos', () => {
    expect(componente).toBeTruthy();
    expect(componente.reservas()).toEqual([]);
    expect(componente.cargando()).toBeFalse();
    expect(componente.error()).toBeNull();
    expect(componente.dialogoVisible()).toBeFalse();
    expect(componente.reservaACalificar()).toBeNull();
  });

  describe('ngOnInit / cargar', () => {
    it('carga las reservas del usuario al iniciar', () => {
      componente.ngOnInit();

      expect(reservaService.listarMisReservas).toHaveBeenCalledTimes(1);
      expect(componente.reservas().length).toBe(2);
      expect(componente.cargando()).toBeFalse();
    });

    it('muestra un mensaje de error si el listado falla', () => {
      reservaService.listarMisReservas.and.returnValue(throwError(() => ({ status: 500 })));

      componente.cargar();

      expect(componente.cargando()).toBeFalse();
      expect(componente.error()).toContain('GET /reservas');
      expect(componente.reservas()).toEqual([]);
    });

    it('limpia el error previo al recargar', () => {
      componente.error.set('error viejo');

      componente.cargar();

      expect(componente.error()).toBeNull();
    });
  });

  describe('resolverNombresCanchas', () => {
    it('deja la lista vacía sin consultar canchas cuando no hay reservas', () => {
      reservaService.listarMisReservas.and.returnValue(of([]));

      componente.cargar();

      expect(componente.reservas()).toEqual([]);
      expect(canchaService.obtener).not.toHaveBeenCalled();
      expect(componente.cargando()).toBeFalse();
    });

    it('adjunta el nombre de la cancha a cada reserva', () => {
      componente.cargar();

      expect(componente.reservas().map((r) => r.cancha_nombre)).toEqual([
        'Cancha Norte',
        'Cancha Sur',
      ]);
    });

    it('consulta una sola vez cada cancha repetida', () => {
      reservaService.listarMisReservas.and.returnValue(
        of([reserva(1, 1), reserva(2, 1), reserva(3, 2)]),
      );

      componente.cargar();

      expect(canchaService.obtener).toHaveBeenCalledTimes(2);
      expect(componente.reservas().map((r) => r.cancha_nombre)).toEqual([
        'Cancha Norte',
        'Cancha Norte',
        'Cancha Sur',
      ]);
    });

    it('usa un nombre de reemplazo si no se pueden resolver las canchas', () => {
      canchaService.obtener.and.returnValue(throwError(() => ({ status: 500 })));

      componente.cargar();

      expect(componente.reservas().map((r) => r.cancha_nombre)).toEqual([
        'Cancha #1',
        'Cancha #2',
      ]);
      expect(componente.cargando()).toBeFalse();
    });
  });

  describe('puedeCalificar', () => {
    it('permite calificar una reserva CONFIRMADA sin calificación', () => {
      const item = { ...reserva(1, 1, { estado: 'CONFIRMADA' }), cancha_nombre: 'X' };

      expect(componente.puedeCalificar(item)).toBeTrue();
    });

    it('permite calificar una reserva COMPLETADA sin calificación', () => {
      const item = { ...reserva(1, 1, { estado: 'COMPLETADA' }), cancha_nombre: 'X' };

      expect(componente.puedeCalificar(item)).toBeTrue();
    });

    it('no permite calificar una reserva PENDIENTE', () => {
      const item = { ...reserva(1, 1, { estado: 'PENDIENTE' }), cancha_nombre: 'X' };

      expect(componente.puedeCalificar(item)).toBeFalse();
    });

    it('no permite calificar dos veces la misma reserva', () => {
      const item = {
        ...reserva(1, 1, { estado: 'COMPLETADA', calificacion: CALIFICACION }),
        cancha_nombre: 'X',
      };

      expect(componente.puedeCalificar(item)).toBeFalse();
    });
  });

  describe('abrirCalificar', () => {
    it('selecciona la reserva, limpia el error y abre el diálogo', () => {
      const item = { ...reserva(1, 1), cancha_nombre: 'Cancha Norte' };
      componente.errorCalificacion.set('error viejo');

      componente.abrirCalificar(item);

      expect(componente.reservaACalificar()).toEqual(item);
      expect(componente.errorCalificacion()).toBeNull();
      expect(componente.dialogoVisible()).toBeTrue();
    });
  });

  describe('onCalificar', () => {
    beforeEach(() => componente.cargar());

    it('no hace nada si no hay reserva seleccionada', () => {
      componente.onCalificar({ puntaje: 5, comentario: 'genial' });

      expect(calificacionService.calificar).not.toHaveBeenCalled();
    });

    it('envía la calificación con los ids de la reserva seleccionada', () => {
      componente.abrirCalificar(componente.reservas()[0]);

      componente.onCalificar({ puntaje: 5, comentario: 'genial' });

      expect(calificacionService.calificar).toHaveBeenCalledOnceWith(1, 1, 5, 'genial');
    });

    it('cierra el diálogo, adjunta la calificación a la reserva y avisa', () => {
      componente.abrirCalificar(componente.reservas()[0]);

      componente.onCalificar({ puntaje: 5, comentario: 'genial' });

      expect(componente.dialogoVisible()).toBeFalse();
      expect(componente.guardandoCalificacion()).toBeFalse();
      expect(componente.reservas()[0].calificacion).toEqual(CALIFICACION);
      expect(componente.reservas()[1].calificacion).toBeUndefined();
      expect(messageService.add).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ severity: 'success' }),
      );
    });

    it('mantiene el diálogo abierto y muestra el error si falla', () => {
      calificacionService.calificar.and.returnValue(throwError(() => ({ status: 500 })));
      componente.abrirCalificar(componente.reservas()[0]);

      componente.onCalificar({ puntaje: 3, comentario: '' });

      expect(componente.dialogoVisible()).toBeTrue();
      expect(componente.guardandoCalificacion()).toBeFalse();
      expect(componente.errorCalificacion()).toBe(
        'No se pudo enviar la calificación. Intenta nuevamente.',
      );
      expect(componente.reservas()[0].calificacion).toBeUndefined();
    });
  });

  describe('severidadEstado', () => {
    it('devuelve success para CONFIRMADA', () => {
      expect(componente.severidadEstado('CONFIRMADA')).toBe('success');
    });

    it('devuelve success para COMPLETADA', () => {
      expect(componente.severidadEstado('COMPLETADA')).toBe('success');
    });

    it('devuelve info para PENDIENTE', () => {
      expect(componente.severidadEstado('PENDIENTE')).toBe('info');
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

    it('devuelve warn cuando la reserva aún no tiene pago', () => {
      expect(componente.severidadPago(undefined)).toBe('warn');
    });
  });
});
