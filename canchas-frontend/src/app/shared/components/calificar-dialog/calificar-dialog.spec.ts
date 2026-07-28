import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalificarDialog } from './calificar-dialog';

describe('CalificarDialog', () => {
  let fixture: ComponentFixture<CalificarDialog>;
  let componente: CalificarDialog;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [CalificarDialog] });

    TestBed.overrideComponent(CalificarDialog, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CalificarDialog);
    componente = fixture.componentInstance;
  });

  it('se crea con puntaje 0 y comentario vacío', () => {
    expect(componente).toBeTruthy();
    expect(componente.puntaje()).toBe(0);
    expect(componente.comentario()).toBe('');
  });

  describe('entradas por defecto', () => {
    it('arranca oculto, sin nombre de cancha, sin guardar y sin error', () => {
      fixture.detectChanges();

      expect(componente.visible()).toBeFalse();
      expect(componente.canchaNombre()).toBe('');
      expect(componente.guardando()).toBeFalse();
      expect(componente.error()).toBeNull();
    });

    it('refleja las entradas recibidas del contenedor', () => {
      fixture.componentRef.setInput('canchaNombre', 'Cancha Norte');
      fixture.componentRef.setInput('guardando', true);
      fixture.componentRef.setInput('error', 'Falló el envío');
      fixture.detectChanges();

      expect(componente.canchaNombre()).toBe('Cancha Norte');
      expect(componente.guardando()).toBeTrue();
      expect(componente.error()).toBe('Falló el envío');
    });
  });

  describe('efecto de apertura', () => {
    it('limpia puntaje y comentario al abrirse', () => {
      componente.puntaje.set(4);
      componente.comentario.set('residuo anterior');

      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      expect(componente.puntaje()).toBe(0);
      expect(componente.comentario()).toBe('');
    });

    it('no borra lo que el usuario escribe mientras sigue abierto', () => {
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      componente.puntaje.set(5);
      componente.comentario.set('muy buena');
      fixture.detectChanges();

      expect(componente.puntaje()).toBe(5);
      expect(componente.comentario()).toBe('muy buena');
    });

    it('vuelve a limpiar al cerrar y reabrir', () => {
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();
      componente.puntaje.set(5);
      componente.comentario.set('muy buena');

      fixture.componentRef.setInput('visible', false);
      fixture.detectChanges();
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      expect(componente.puntaje()).toBe(0);
      expect(componente.comentario()).toBe('');
    });
  });

  describe('onConfirmar', () => {
    it('no emite nada si no se eligió ninguna estrella', () => {
      const emitido = jasmine.createSpy('calificar');
      componente.calificar.subscribe(emitido);

      componente.onConfirmar();

      expect(emitido).not.toHaveBeenCalled();
    });

    it('emite puntaje y comentario cuando hay al menos una estrella', () => {
      const emitido = jasmine.createSpy('calificar');
      componente.calificar.subscribe(emitido);
      componente.puntaje.set(4);
      componente.comentario.set('buena cancha');

      componente.onConfirmar();

      expect(emitido).toHaveBeenCalledOnceWith({ puntaje: 4, comentario: 'buena cancha' });
    });

    it('permite confirmar con comentario vacío', () => {
      const emitido = jasmine.createSpy('calificar');
      componente.calificar.subscribe(emitido);
      componente.puntaje.set(1);

      componente.onConfirmar();

      expect(emitido).toHaveBeenCalledOnceWith({ puntaje: 1, comentario: '' });
    });
  });

  describe('cancelar', () => {
    it('expone una salida para cerrar el diálogo', () => {
      const emitido = jasmine.createSpy('cancelar');
      componente.cancelar.subscribe(emitido);

      componente.cancelar.emit();

      expect(emitido).toHaveBeenCalledTimes(1);
    });
  });
});
