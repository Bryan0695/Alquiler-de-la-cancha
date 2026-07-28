import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let componente: ConfirmDialog;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [ConfirmDialog] });

    TestBed.overrideComponent(ConfirmDialog, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crea correctamente', () => {
    expect(componente).toBeTruthy();
  });

  describe('valores por defecto', () => {
    it('arranca oculto con textos genéricos y severidad danger', () => {
      expect(componente.visible()).toBeFalse();
      expect(componente.titulo()).toBe('Confirmar acción');
      expect(componente.mensaje()).toBe('¿Deseas continuar?');
      expect(componente.detalle()).toBeNull();
      expect(componente.textoConfirmar()).toBe('Sí, eliminar');
      expect(componente.textoCancelar()).toBe('Cancelar');
      expect(componente.severidad()).toBe('danger');
    });
  });

  describe('entradas personalizadas', () => {
    it('acepta que el contenedor sobrescriba todos los textos', () => {
      fixture.componentRef.setInput('visible', true);
      fixture.componentRef.setInput('titulo', 'Eliminar cancha');
      fixture.componentRef.setInput('mensaje', '¿Seguro que quieres eliminarla?');
      fixture.componentRef.setInput('detalle', 'Cancha Norte');
      fixture.componentRef.setInput('textoConfirmar', 'Eliminar');
      fixture.componentRef.setInput('textoCancelar', 'Volver');
      fixture.componentRef.setInput('severidad', 'primary');
      fixture.detectChanges();

      expect(componente.visible()).toBeTrue();
      expect(componente.titulo()).toBe('Eliminar cancha');
      expect(componente.mensaje()).toBe('¿Seguro que quieres eliminarla?');
      expect(componente.detalle()).toBe('Cancha Norte');
      expect(componente.textoConfirmar()).toBe('Eliminar');
      expect(componente.textoCancelar()).toBe('Volver');
      expect(componente.severidad()).toBe('primary');
    });
  });

  describe('salidas', () => {
    it('emite confirmar', () => {
      const emitido = jasmine.createSpy('confirmar');
      componente.confirmar.subscribe(emitido);

      componente.confirmar.emit();

      expect(emitido).toHaveBeenCalledTimes(1);
    });

    it('emite cancelar', () => {
      const emitido = jasmine.createSpy('cancelar');
      componente.cancelar.subscribe(emitido);

      componente.cancelar.emit();

      expect(emitido).toHaveBeenCalledTimes(1);
    });
  });
});
