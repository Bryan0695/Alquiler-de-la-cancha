import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinner } from './loading-spinner';

describe('LoadingSpinner', () => {
  let fixture: ComponentFixture<LoadingSpinner>;
  let componente: LoadingSpinner;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [LoadingSpinner] });

    TestBed.overrideComponent(LoadingSpinner, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(LoadingSpinner);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crea correctamente', () => {
    expect(componente).toBeTruthy();
  });

  it('arranca oculto con el mensaje por defecto', () => {
    expect(componente.cargando()).toBeFalse();
    expect(componente.mensaje()).toBe('Cargando...');
  });

  it('acepta que el contenedor active la carga y cambie el mensaje', () => {
    fixture.componentRef.setInput('cargando', true);
    fixture.componentRef.setInput('mensaje', 'Buscando horarios...');
    fixture.detectChanges();

    expect(componente.cargando()).toBeTrue();
    expect(componente.mensaje()).toBe('Buscando horarios...');
  });
});
