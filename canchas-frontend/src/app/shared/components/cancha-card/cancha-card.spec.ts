import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cancha } from '../../../core/models/cancha.model';
import { CanchaCard } from './cancha-card';

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

describe('CanchaCard', () => {
  let fixture: ComponentFixture<CanchaCard>;
  let componente: CanchaCard;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [CanchaCard] });

    TestBed.overrideComponent(CanchaCard, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CanchaCard);
    componente = fixture.componentInstance;
  });

  it('se crea correctamente', () => {
    expect(componente).toBeTruthy();
  });

  describe('cancha (entrada requerida)', () => {
    it('expone la cancha recibida', () => {
      fixture.componentRef.setInput('cancha', CANCHA);
      fixture.detectChanges();

      expect(componente.cancha()).toEqual(CANCHA);
    });

    it('falla si se lee antes de recibir la cancha', () => {
      expect(() => componente.cancha()).toThrow();
    });
  });

  describe('reservar (salida)', () => {
    it('emite la cancha sobre la que se pulsó reservar', () => {
      const emitido = jasmine.createSpy('reservar');
      componente.reservar.subscribe(emitido);
      fixture.componentRef.setInput('cancha', CANCHA);
      fixture.detectChanges();

      componente.reservar.emit(componente.cancha());

      expect(emitido).toHaveBeenCalledOnceWith(CANCHA);
    });
  });
});
