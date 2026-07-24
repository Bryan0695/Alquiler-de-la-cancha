import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models/usuario.model';
import { MainLayout } from './main-layout';

const JUGADOR: Usuario = { id: 1, nombre: 'Ana', correo: 'ana@test.com', rol: 'JUGADOR' };
const ADMIN: Usuario = { id: 2, nombre: 'Root', correo: 'root@test.com', rol: 'ADMINISTRADOR' };

describe('MainLayout', () => {
  let fixture: ComponentFixture<MainLayout>;
  let componente: MainLayout;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;
  let logout: jasmine.Spy;
  const usuarioSignal = signal<Usuario | null>(null);
  const esAdminSignal = signal(false);

  beforeEach(async () => {
    usuarioSignal.set(null);
    esAdminSignal.set(false);
    logout = jasmine.createSpy('logout');
    router = jasmine.createSpyObj('Router', ['navigate']);

    const authStub = {
      usuario: usuarioSignal.asReadonly(),
      esAdministrador: esAdminSignal.asReadonly(),
      logout,
    };

    TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: router },
      ],
    });

    TestBed.overrideComponent(MainLayout, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    componente = fixture.componentInstance;
  });

  it('se crea correctamente', () => {
    expect(componente).toBeTruthy();
  });

  describe('usuario', () => {
    it('expone el usuario en sesión del servicio de autenticación', () => {
      usuarioSignal.set(JUGADOR);

      expect(componente.usuario()).toEqual(JUGADOR);
    });

    it('es null cuando no hay sesión', () => {
      expect(componente.usuario()).toBeNull();
    });
  });

  describe('menuVisible', () => {
    it('muestra solo las opciones de jugador cuando no es administrador', () => {
      usuarioSignal.set(JUGADOR);
      esAdminSignal.set(false);

      expect(componente.menuVisible().map((i) => i.ruta)).toEqual(['/canchas', '/reservas']);
    });

    it('muestra solo las opciones de administración cuando es administrador', () => {
      usuarioSignal.set(ADMIN);
      esAdminSignal.set(true);

      expect(componente.menuVisible().map((i) => i.ruta)).toEqual([
        '/admin/canchas',
        '/admin/reservas',
      ]);
    });

    it('recalcula el menú cuando cambia el rol', () => {
      esAdminSignal.set(false);
      expect(componente.menuVisible().length).toBe(2);

      esAdminSignal.set(true);

      expect(componente.menuVisible().map((i) => i.ruta)).toEqual([
        '/admin/canchas',
        '/admin/reservas',
      ]);
    });

    it('incluye etiqueta e icono en cada opción', () => {
      esAdminSignal.set(false);

      for (const item of componente.menuVisible()) {
        expect(item.etiqueta.length).toBeGreaterThan(0);
        expect(item.icono).toContain('pi ');
      }
    });
  });

  describe('cerrarSesion', () => {
    it('cierra la sesión y lleva al login', () => {
      componente.cerrarSesion();

      expect(logout).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
    });
  });
});
