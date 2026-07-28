import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { Cancha } from '../../../core/models/cancha.model';
import { CanchaService } from '../../../core/services/cancha.service';
import { CanchasList } from './canchas-list';

const CANCHA_A: Cancha = {
  id: 1,
  nombre: 'Cancha Norte',
  tipo: 'futbol5',
  precio_hora: 25,
  hora_apertura: '08:00',
  hora_cierre: '22:00',
  promedio_calificacion: 4.5,
  activa: true,
};

const CANCHA_B: Cancha = { ...CANCHA_A, id: 2, nombre: 'Cancha Sur' };

describe('CanchasList', () => {
  let fixture: ComponentFixture<CanchasList>;
  let componente: CanchasList;
  let canchaService: jasmine.SpyObj<Pick<CanchaService, 'listar' | 'eliminar'>>;
  let messageService: jasmine.SpyObj<Pick<MessageService, 'add'>>;

  beforeEach(async () => {
    canchaService = jasmine.createSpyObj('CanchaService', ['listar', 'eliminar']);
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    canchaService.listar.and.returnValue(of([CANCHA_A, CANCHA_B]));

    TestBed.configureTestingModule({
      imports: [CanchasList],
      providers: [
        { provide: CanchaService, useValue: canchaService },
        { provide: MessageService, useValue: messageService },
      ],
    });

    // `providers: []` retira el MessageService propio del componente para que
    // se resuelva el espía registrado en el TestBed.
    TestBed.overrideComponent(CanchasList, { set: { template: '', providers: [] } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CanchasList);
    componente = fixture.componentInstance;
  });

  it('se crea con el estado inicial vacío', () => {
    expect(componente).toBeTruthy();
    expect(componente.canchas()).toEqual([]);
    expect(componente.cargando()).toBeFalse();
    expect(componente.formularioVisible()).toBeFalse();
    expect(componente.confirmacionVisible()).toBeFalse();
    expect(componente.canchaEnEdicion()).toBeNull();
    expect(componente.canchaAEliminar()).toBeNull();
  });

  describe('ngOnInit', () => {
    it('carga las canchas al iniciar', () => {
      componente.ngOnInit();

      expect(canchaService.listar).toHaveBeenCalledTimes(1);
      expect(componente.canchas()).toEqual([CANCHA_A, CANCHA_B]);
    });
  });

  describe('cargar', () => {
    it('guarda las canchas y apaga el indicador de carga', () => {
      componente.cargar();

      expect(componente.canchas()).toEqual([CANCHA_A, CANCHA_B]);
      expect(componente.cargando()).toBeFalse();
      expect(messageService.add).not.toHaveBeenCalled();
    });

    it('muestra un toast de error y apaga la carga si el backend falla', () => {
      canchaService.listar.and.returnValue(throwError(() => ({ status: 500 })));

      componente.cargar();

      expect(componente.cargando()).toBeFalse();
      expect(messageService.add).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ severity: 'error', summary: 'Error' }),
      );
    });
  });

  describe('abrirCrear', () => {
    it('abre el formulario sin cancha en edición', () => {
      componente.canchaEnEdicion.set(CANCHA_A);

      componente.abrirCrear();

      expect(componente.canchaEnEdicion()).toBeNull();
      expect(componente.formularioVisible()).toBeTrue();
    });
  });

  describe('abrirEditar', () => {
    it('abre el formulario con la cancha seleccionada', () => {
      componente.abrirEditar(CANCHA_B);

      expect(componente.canchaEnEdicion()).toEqual(CANCHA_B);
      expect(componente.formularioVisible()).toBeTrue();
    });
  });

  describe('onGuardado', () => {
    it('cierra el formulario, avisa del éxito y recarga la lista', () => {
      componente.formularioVisible.set(true);

      componente.onGuardado();

      expect(componente.formularioVisible()).toBeFalse();
      expect(messageService.add).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ severity: 'success', summary: 'Listo' }),
      );
      expect(canchaService.listar).toHaveBeenCalledTimes(1);
    });
  });

  describe('pedirConfirmacionEliminar', () => {
    it('guarda la cancha objetivo y abre el diálogo', () => {
      componente.pedirConfirmacionEliminar(CANCHA_A);

      expect(componente.canchaAEliminar()).toEqual(CANCHA_A);
      expect(componente.confirmacionVisible()).toBeTrue();
    });
  });

  describe('confirmarEliminar', () => {
    it('no hace nada si no hay cancha seleccionada', () => {
      componente.confirmarEliminar();

      expect(canchaService.eliminar).not.toHaveBeenCalled();
      expect(messageService.add).not.toHaveBeenCalled();
    });

    it('elimina, cierra el diálogo, avisa y recarga', () => {
      canchaService.eliminar.and.returnValue(of({ mensaje: 'ok' }));
      componente.pedirConfirmacionEliminar(CANCHA_A);

      componente.confirmarEliminar();

      expect(canchaService.eliminar).toHaveBeenCalledOnceWith(CANCHA_A.id);
      expect(componente.confirmacionVisible()).toBeFalse();
      expect(messageService.add).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ severity: 'success', detail: 'Cancha Norte' }),
      );
      expect(canchaService.listar).toHaveBeenCalledTimes(1);
    });

    it('avisa que la cancha tiene reservas activas ante un 409', () => {
      canchaService.eliminar.and.returnValue(throwError(() => ({ status: 409 })));
      componente.pedirConfirmacionEliminar(CANCHA_A);

      componente.confirmarEliminar();

      expect(componente.confirmacionVisible()).toBeFalse();
      expect(messageService.add).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          severity: 'error',
          detail: 'Esta cancha tiene reservas activas y no se puede eliminar.',
        }),
      );
      expect(canchaService.listar).not.toHaveBeenCalled();
    });

    it('muestra un mensaje genérico ante otros errores', () => {
      canchaService.eliminar.and.returnValue(throwError(() => ({ status: 500 })));
      componente.pedirConfirmacionEliminar(CANCHA_A);

      componente.confirmarEliminar();

      expect(messageService.add).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ detail: 'No se pudo eliminar la cancha.' }),
      );
    });
  });
});
