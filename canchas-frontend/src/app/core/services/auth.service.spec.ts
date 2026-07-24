import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../models/auth.model';
import { Usuario } from '../models/usuario.model';
import { AuthService } from './auth.service';

const TOKEN_KEY = 'canchas_token';
const USUARIO_KEY = 'canchas_usuario';

const JUGADOR: Usuario = { id: 1, nombre: 'Ana', correo: 'ana@test.com', rol: 'JUGADOR' };
const ADMIN: Usuario = { id: 2, nombre: 'Root', correo: 'root@test.com', rol: 'ADMINISTRADOR' };

describe('AuthService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    httpMock?.verify();
    localStorage.clear();
  });

  /** El servicio se crea de forma perezosa para poder preparar localStorage antes. */
  function crearServicio(): AuthService {
    const service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    return service;
  }

  it('se instancia correctamente', () => {
    expect(crearServicio()).toBeTruthy();
  });

  describe('leerUsuarioGuardado (estado inicial)', () => {
    it('deja el usuario en null cuando no hay nada guardado', () => {
      const service = crearServicio();

      expect(service.usuario()).toBeNull();
      expect(service.estaAutenticado()).toBeFalse();
      expect(service.esAdministrador()).toBeFalse();
    });

    it('rehidrata el usuario desde localStorage', () => {
      localStorage.setItem(USUARIO_KEY, JSON.stringify(ADMIN));

      const service = crearServicio();

      expect(service.usuario()).toEqual(ADMIN);
      expect(service.estaAutenticado()).toBeTrue();
      expect(service.esAdministrador()).toBeTrue();
    });

    it('devuelve null si el JSON guardado está corrupto', () => {
      localStorage.setItem(USUARIO_KEY, '{esto no es json');

      const service = crearServicio();

      expect(service.usuario()).toBeNull();
      expect(service.estaAutenticado()).toBeFalse();
    });
  });

  describe('login', () => {
    it('hace POST a /login con las credenciales', () => {
      const service = crearServicio();
      const credenciales = { correo: 'ana@test.com', password: 'secreta' };

      service.login(credenciales).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credenciales);
      req.flush({ token: 'abc', usuario: JUGADOR } as LoginResponse);
    });

    it('guarda token y usuario, y actualiza las señales', () => {
      const service = crearServicio();
      let recibido: LoginResponse | undefined;

      service.login({ correo: 'ana@test.com', password: 'x' }).subscribe((r) => (recibido = r));
      httpMock
        .expectOne(`${environment.apiUrl}/login`)
        .flush({ token: 'token-123', usuario: JUGADOR } as LoginResponse);

      expect(recibido?.token).toBe('token-123');
      expect(localStorage.getItem(TOKEN_KEY)).toBe('token-123');
      expect(JSON.parse(localStorage.getItem(USUARIO_KEY)!)).toEqual(JUGADOR);
      expect(service.usuario()).toEqual(JUGADOR);
      expect(service.estaAutenticado()).toBeTrue();
      expect(service.esAdministrador()).toBeFalse();
    });

    it('marca esAdministrador cuando el rol es ADMINISTRADOR', () => {
      const service = crearServicio();

      service.login({ correo: 'root@test.com', password: 'x' }).subscribe();
      httpMock
        .expectOne(`${environment.apiUrl}/login`)
        .flush({ token: 't', usuario: ADMIN } as LoginResponse);

      expect(service.esAdministrador()).toBeTrue();
    });

    it('no guarda nada si la petición falla', () => {
      const service = crearServicio();

      service.login({ correo: 'ana@test.com', password: 'mala' }).subscribe({
        next: () => fail('no debería emitir'),
        error: () => undefined,
      });
      httpMock
        .expectOne(`${environment.apiUrl}/login`)
        .flush({ detail: 'credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.usuario()).toBeNull();
    });
  });

  describe('registrar', () => {
    it('hace POST a /registro y devuelve el usuario creado', () => {
      const service = crearServicio();
      const datos = { nombre: 'Ana', correo: 'ana@test.com', password: 'secreta' };
      let creado: Usuario | undefined;

      service.registrar(datos).subscribe((u) => (creado = u));

      const req = httpMock.expectOne(`${environment.apiUrl}/registro`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(datos);
      req.flush(JUGADOR);

      expect(creado).toEqual(JUGADOR);
    });

    it('no autentica al usuario recién registrado', () => {
      const service = crearServicio();

      service.registrar({ nombre: 'Ana', correo: 'ana@test.com', password: 'x' }).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/registro`).flush(JUGADOR);

      expect(service.estaAutenticado()).toBeFalse();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('logout', () => {
    it('borra token, usuario y resetea las señales', () => {
      localStorage.setItem(TOKEN_KEY, 'token-123');
      localStorage.setItem(USUARIO_KEY, JSON.stringify(ADMIN));
      const service = crearServicio();

      service.logout();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USUARIO_KEY)).toBeNull();
      expect(service.usuario()).toBeNull();
      expect(service.estaAutenticado()).toBeFalse();
      expect(service.esAdministrador()).toBeFalse();
    });

    it('es idempotente si no había sesión', () => {
      const service = crearServicio();

      expect(() => service.logout()).not.toThrow();
      expect(service.usuario()).toBeNull();
    });
  });

  describe('obtenerToken', () => {
    it('devuelve el token guardado', () => {
      localStorage.setItem(TOKEN_KEY, 'token-123');

      expect(crearServicio().obtenerToken()).toBe('token-123');
    });

    it('devuelve null si no hay token', () => {
      expect(crearServicio().obtenerToken()).toBeNull();
    });
  });
});
