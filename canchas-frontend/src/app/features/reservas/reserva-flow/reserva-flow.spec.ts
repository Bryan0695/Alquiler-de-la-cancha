import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Cancha } from '../../../core/models/cancha.model';
import { Horario, Reserva } from '../../../core/models/reserva.model';
import { CanchaService } from '../../../core/services/cancha.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { ReservaFlow } from './reserva-flow';

const CANCHA_ID = 7;

const CANCHA: Cancha = {
  id: CANCHA_ID,
  nombre: 'Cancha Norte',
  tipo: 'futbol5',
  precio_hora: 25,
  hora_apertura: '08:00',
  hora_cierre: '22:00',
  promedio_calificacion: 4.5,
  activa: true,
};

const LIBRE: Horario = {
  id: 10,
  fecha: '2026-07-24',
  hora_inicio: '18:00',
  hora_fin: '19:00',
  estado: 'LIBRE',
};

const OCUPADO: Horario = { ...LIBRE, id: 11, hora_inicio: '19:00', estado: 'OCUPADO' };

const RESERVA: Reserva = {
  id: 99,
  fecha_creacion: '2026-07-24T10:00:00',
  monto_total: 25,
  estado: 'CONFIRMADA',
  cancha_id: CANCHA_ID,
  horario_id: LIBRE.id,
  usuario_id: 3,
};

describe('ReservaFlow', () => {
  let fixture: ComponentFixture<ReservaFlow>;
  let componente: ReservaFlow;
  let canchaService: jasmine.SpyObj<Pick<CanchaService, 'obtener'>>;
  let reservaService: jasmine.SpyObj<Pick<ReservaService, 'obtenerDisponibilidad' | 'reservar'>>;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    canchaService = jasmine.createSpyObj('CanchaService', ['obtener']);
    canchaService.obtener.and.returnValue(of(CANCHA));

    reservaService = jasmine.createSpyObj('ReservaService', ['obtenerDisponibilidad', 'reservar']);
    reservaService.obtenerDisponibilidad.and.returnValue(of([LIBRE, OCUPADO]));
    reservaService.reservar.and.returnValue(of(RESERVA));

    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [ReservaFlow],
      providers: [
        { provide: CanchaService, useValue: canchaService },
        { provide: ReservaService, useValue: reservaService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: String(CANCHA_ID) }) } },
        },
      ],
    });

    TestBed.overrideComponent(ReservaFlow, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ReservaFlow);
    componente = fixture.componentInstance;
  });

  it('se crea en el paso "horario" y esperando la cancha', () => {
    expect(componente).toBeTruthy();
    expect(componente.paso()).toBe('horario');
    expect(componente.cancha()).toBeNull();
    expect(componente.cargandoCancha()).toBeTrue();
    expect(componente.horarioSeleccionado()).toBeNull();
    expect(componente.reservaCreada()).toBeNull();
  });

  describe('ngOnInit', () => {
    it('carga la cancha del id de la ruta y luego sus horarios', () => {
      componente.ngOnInit();

      expect(canchaService.obtener).toHaveBeenCalledOnceWith(CANCHA_ID);
      expect(componente.cancha()).toEqual(CANCHA);
      expect(componente.cargandoCancha()).toBeFalse();
      expect(reservaService.obtenerDisponibilidad).toHaveBeenCalledTimes(1);
    });

    it('deja de cargar y no pide horarios si la cancha no existe', () => {
      canchaService.obtener.and.returnValue(throwError(() => ({ status: 404 })));

      componente.ngOnInit();

      expect(componente.cargandoCancha()).toBeFalse();
      expect(componente.cancha()).toBeNull();
      expect(reservaService.obtenerDisponibilidad).not.toHaveBeenCalled();
    });
  });

  describe('totalEstimado', () => {
    it('vale 0 mientras no se conoce la cancha', () => {
      expect(componente.totalEstimado()).toBe(0);
    });

    it('refleja el precio por hora una vez cargada la cancha', () => {
      componente.ngOnInit();

      expect(componente.totalEstimado()).toBe(CANCHA.precio_hora);
    });
  });

  describe('cargarHorarios', () => {
    it('consulta la disponibilidad con la fecha en formato ISO local', () => {
      componente.fecha.set(new Date(2026, 6, 5));

      componente.cargarHorarios();

      expect(reservaService.obtenerDisponibilidad).toHaveBeenCalledOnceWith(CANCHA_ID, '2026-07-05');
      expect(componente.horarios()).toEqual([LIBRE, OCUPADO]);
      expect(componente.cargandoHorarios()).toBeFalse();
      expect(componente.errorHorarios()).toBeNull();
    });

    it('rellena mes y día con ceros a la izquierda', () => {
      componente.fecha.set(new Date(2026, 0, 3));

      componente.cargarHorarios();

      expect(reservaService.obtenerDisponibilidad).toHaveBeenCalledOnceWith(CANCHA_ID, '2026-01-03');
    });

    it('muestra el mensaje de endpoint faltante si falla', () => {
      reservaService.obtenerDisponibilidad.and.returnValue(throwError(() => ({ status: 404 })));

      componente.cargarHorarios();

      expect(componente.cargandoHorarios()).toBeFalse();
      expect(componente.errorHorarios()).toContain('ReservaService');
    });
  });

  describe('onFechaCambiada', () => {
    it('actualiza la fecha, olvida el horario elegido y recarga', () => {
      componente.horarioSeleccionado.set(LIBRE);
      const nuevaFecha = new Date(2026, 11, 25);

      componente.onFechaCambiada(nuevaFecha);

      expect(componente.fecha()).toBe(nuevaFecha);
      expect(componente.horarioSeleccionado()).toBeNull();
      expect(reservaService.obtenerDisponibilidad).toHaveBeenCalledOnceWith(CANCHA_ID, '2026-12-25');
    });
  });

  describe('seleccionarHorario', () => {
    it('avanza al paso de confirmación con un horario libre', () => {
      componente.seleccionarHorario(LIBRE);

      expect(componente.horarioSeleccionado()).toEqual(LIBRE);
      expect(componente.paso()).toBe('confirmar');
    });

    it('ignora los horarios ocupados', () => {
      componente.seleccionarHorario(OCUPADO);

      expect(componente.horarioSeleccionado()).toBeNull();
      expect(componente.paso()).toBe('horario');
    });
  });

  describe('confirmarYPagar', () => {
    it('no hace nada si no hay horario seleccionado', () => {
      componente.confirmarYPagar();

      expect(reservaService.reservar).not.toHaveBeenCalled();
      expect(componente.confirmando()).toBeFalse();
    });

    it('crea la reserva y pasa al paso "listo"', () => {
      componente.seleccionarHorario(LIBRE);

      componente.confirmarYPagar();

      expect(reservaService.reservar).toHaveBeenCalledOnceWith(CANCHA_ID, LIBRE.id);
      expect(componente.reservaCreada()).toEqual(RESERVA);
      expect(componente.paso()).toBe('listo');
      expect(componente.confirmando()).toBeFalse();
      expect(componente.errorConfirmar()).toBeNull();
    });

    it('ante un 409 vuelve al paso de horarios, avisa y recarga la disponibilidad', () => {
      reservaService.reservar.and.returnValue(throwError(() => ({ status: 409 })));
      componente.seleccionarHorario(LIBRE);

      componente.confirmarYPagar();

      expect(componente.errorConfirmar()).toBe('Ese horario ya fue tomado por otro usuario. Elige otro.');
      expect(componente.paso()).toBe('horario');
      expect(componente.reservaCreada()).toBeNull();
      expect(reservaService.obtenerDisponibilidad).toHaveBeenCalledTimes(1);
    });

    it('ante otro error se queda en confirmar con mensaje genérico', () => {
      reservaService.reservar.and.returnValue(throwError(() => ({ status: 500 })));
      componente.seleccionarHorario(LIBRE);

      componente.confirmarYPagar();

      expect(componente.errorConfirmar()).toBe('No se pudo completar la reserva. Intenta nuevamente.');
      expect(componente.paso()).toBe('confirmar');
      expect(componente.confirmando()).toBeFalse();
      expect(reservaService.obtenerDisponibilidad).not.toHaveBeenCalled();
    });
  });

  describe('volverAHorarios', () => {
    it('regresa al paso de selección de horario', () => {
      componente.paso.set('confirmar');

      componente.volverAHorarios();

      expect(componente.paso()).toBe('horario');
    });
  });

  describe('volverABuscar', () => {
    it('navega al listado público de canchas', () => {
      componente.volverABuscar();

      expect(router.navigate).toHaveBeenCalledOnceWith(['/canchas']);
    });
  });
});
