import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Cancha } from '../../../core/models/cancha.model';
import { CanchaService } from '../../../core/services/cancha.service';
import { CanchasBuscar } from './canchas-buscar';

const ACTIVA: Cancha = {
  id: 1,
  nombre: 'Cancha Norte',
  tipo: 'futbol5',
  precio_hora: 25,
  hora_apertura: '08:00',
  hora_cierre: '22:00',
  promedio_calificacion: 4.5,
  activa: true,
};

const INACTIVA: Cancha = { ...ACTIVA, id: 2, nombre: 'Cancha Cerrada', activa: false };

describe('CanchasBuscar', () => {
  let fixture: ComponentFixture<CanchasBuscar>;
  let componente: CanchasBuscar;
  let canchaService: jasmine.SpyObj<Pick<CanchaService, 'buscarPublicas'>>;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    canchaService = jasmine.createSpyObj('CanchaService', ['buscarPublicas']);
    canchaService.buscarPublicas.and.returnValue(of([ACTIVA, INACTIVA]));
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [CanchasBuscar],
      providers: [
        { provide: CanchaService, useValue: canchaService },
        { provide: Router, useValue: router },
      ],
    });

    TestBed.overrideComponent(CanchasBuscar, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(CanchasBuscar);
    componente = fixture.componentInstance;
  });

  it('se crea sin filtros aplicados ni resultados', () => {
    expect(componente).toBeTruthy();
    expect(componente.canchas()).toEqual([]);
    expect(componente.tipoSeleccionado()).toBeNull();
    expect(componente.precioMaximo()).toBeNull();
    expect(componente.error()).toBeNull();
    expect(componente.cargando()).toBeFalse();
  });

  describe('tipos (etiquetaTipo)', () => {
    it('traduce cada tipo técnico a su etiqueta legible', () => {
      expect(componente.tipos).toEqual([
        { label: 'Fútbol 5', value: 'futbol5' },
        { label: 'Fútbol 7', value: 'futbol7' },
        { label: 'Fútbol 11', value: 'futbol11' },
      ]);
    });
  });

  describe('ngOnInit (carga inicial)', () => {
    it('busca sin filtros al iniciar', () => {
      componente.ngOnInit();

      expect(canchaService.buscarPublicas).toHaveBeenCalledOnceWith({
        tipo: undefined,
        precioMax: undefined,
      });
      expect(componente.canchas()).toEqual([ACTIVA, INACTIVA]);
      expect(componente.cargando()).toBeFalse();
    });

    it('muestra el mensaje de endpoint faltante si la búsqueda falla', () => {
      canchaService.buscarPublicas.and.returnValue(throwError(() => ({ status: 404 })));

      componente.ngOnInit();

      expect(componente.cargando()).toBeFalse();
      expect(componente.error()).toContain('GET /canchas/publicas');
      expect(componente.canchas()).toEqual([]);
    });
  });

  describe('canchasFiltradas', () => {
    it('descarta las canchas inactivas', () => {
      componente.ngOnInit();

      expect(componente.canchasFiltradas()).toEqual([ACTIVA]);
    });

    it('devuelve una lista vacía si ninguna cancha está activa', () => {
      canchaService.buscarPublicas.and.returnValue(of([INACTIVA]));

      componente.ngOnInit();

      expect(componente.canchasFiltradas()).toEqual([]);
    });
  });

  describe('aplicarFiltros', () => {
    it('reenvía la búsqueda con el tipo y el precio máximo seleccionados', () => {
      componente.tipoSeleccionado.set('futbol7');
      componente.precioMaximo.set(30);

      componente.aplicarFiltros();

      expect(canchaService.buscarPublicas).toHaveBeenCalledOnceWith({
        tipo: 'futbol7',
        precioMax: 30,
      });
    });

    it('convierte los filtros nulos en undefined', () => {
      componente.tipoSeleccionado.set(null);
      componente.precioMaximo.set(null);

      componente.aplicarFiltros();

      expect(canchaService.buscarPublicas).toHaveBeenCalledOnceWith({
        tipo: undefined,
        precioMax: undefined,
      });
    });

    it('limpia el error anterior antes de volver a buscar', () => {
      componente.error.set('error previo');

      componente.aplicarFiltros();

      expect(componente.error()).toBeNull();
    });
  });

  describe('limpiarFiltros', () => {
    it('resetea ambos filtros y vuelve a buscar sin ellos', () => {
      componente.tipoSeleccionado.set('futbol11');
      componente.precioMaximo.set(15);

      componente.limpiarFiltros();

      expect(componente.tipoSeleccionado()).toBeNull();
      expect(componente.precioMaximo()).toBeNull();
      expect(canchaService.buscarPublicas).toHaveBeenCalledOnceWith({
        tipo: undefined,
        precioMax: undefined,
      });
    });
  });

  describe('irAReservar', () => {
    it('navega al flujo de reserva de la cancha elegida', () => {
      componente.irAReservar(ACTIVA);

      expect(router.navigate).toHaveBeenCalledOnceWith(['/canchas', ACTIVA.id, 'reservar']);
    });
  });
});
