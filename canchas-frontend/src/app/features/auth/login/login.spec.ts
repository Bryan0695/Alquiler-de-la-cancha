import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { LoginResponse } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { Login } from './login';

const RESPUESTA_JUGADOR: LoginResponse = {
  token: 'token-123',
  usuario: { id: 1, nombre: 'Ana', correo: 'ana@test.com', rol: 'JUGADOR' },
};

const RESPUESTA_ADMIN: LoginResponse = {
  token: 'token-456',
  usuario: { id: 2, nombre: 'Root', correo: 'root@test.com', rol: 'ADMINISTRADOR' },
};

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let componente: Login;
  let auth: jasmine.SpyObj<Pick<AuthService, 'login'>>;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthService', ['login']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    // La plantilla real depende de PrimeNG; aquí solo interesa la lógica de la clase.
    TestBed.overrideComponent(Login, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(Login);
    componente = fixture.componentInstance;
  });

  function llenarFormulario(correo = 'ana@test.com', password = 'secreta'): void {
    componente.form.setValue({ correo, password });
  }

  it('se crea con el formulario vacío, sin carga ni error', () => {
    expect(componente).toBeTruthy();
    expect(componente.form.getRawValue()).toEqual({ correo: '', password: '' });
    expect(componente.cargando()).toBeFalse();
    expect(componente.error()).toBeNull();
  });

  describe('validaciones del formulario', () => {
    it('exige correo y contraseña', () => {
      expect(componente.form.invalid).toBeTrue();
      expect(componente.form.controls.correo.hasError('required')).toBeTrue();
      expect(componente.form.controls.password.hasError('required')).toBeTrue();
    });

    it('rechaza un correo con formato inválido', () => {
      componente.form.controls.correo.setValue('no-es-un-correo');

      expect(componente.form.controls.correo.hasError('email')).toBeTrue();
    });

    it('acepta un correo bien formado con contraseña', () => {
      llenarFormulario();

      expect(componente.form.valid).toBeTrue();
    });
  });

  describe('onSubmit', () => {
    it('no llama al servicio si el formulario es inválido y marca los campos como tocados', () => {
      componente.onSubmit();

      expect(auth.login).not.toHaveBeenCalled();
      expect(componente.form.controls.correo.touched).toBeTrue();
      expect(componente.form.controls.password.touched).toBeTrue();
      expect(componente.cargando()).toBeFalse();
    });

    it('envía las credenciales del formulario al servicio', () => {
      auth.login.and.returnValue(of(RESPUESTA_JUGADOR));
      llenarFormulario();

      componente.onSubmit();

      expect(auth.login).toHaveBeenCalledOnceWith({
        correo: 'ana@test.com',
        password: 'secreta',
      });
    });

    it('redirige a /canchas cuando entra un jugador', () => {
      auth.login.and.returnValue(of(RESPUESTA_JUGADOR));
      llenarFormulario();

      componente.onSubmit();

      expect(router.navigate).toHaveBeenCalledOnceWith(['/canchas']);
      expect(componente.cargando()).toBeFalse();
      expect(componente.error()).toBeNull();
    });

    it('redirige a /admin/canchas cuando entra un administrador', () => {
      auth.login.and.returnValue(of(RESPUESTA_ADMIN));
      llenarFormulario('root@test.com');

      componente.onSubmit();

      expect(router.navigate).toHaveBeenCalledOnceWith(['/admin/canchas']);
    });

    it('muestra un mensaje y no navega si las credenciales fallan', () => {
      auth.login.and.returnValue(throwError(() => ({ status: 401 })));
      llenarFormulario();

      componente.onSubmit();

      expect(componente.error()).toBe('Correo o contraseña incorrectos.');
      expect(componente.cargando()).toBeFalse();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('activa el indicador de carga mientras la petición está en curso', () => {
      let cargandoDurantePeticion = false;
      auth.login.and.returnValue(
        new Observable<LoginResponse>((subscriber) => {
          cargandoDurantePeticion = componente.cargando();
          subscriber.next(RESPUESTA_JUGADOR);
          subscriber.complete();
        }),
      );
      llenarFormulario();

      componente.onSubmit();

      expect(cargandoDurantePeticion).toBeTrue();
      expect(componente.cargando()).toBeFalse();
    });

    it('limpia el error de un intento anterior al reintentar', () => {
      auth.login.and.returnValue(throwError(() => ({ status: 401 })));
      llenarFormulario();
      componente.onSubmit();
      expect(componente.error()).not.toBeNull();

      auth.login.and.returnValue(of(RESPUESTA_JUGADOR));
      componente.onSubmit();

      expect(componente.error()).toBeNull();
    });
  });
});
