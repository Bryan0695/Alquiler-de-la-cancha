import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Usuario } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { Registro } from './registro';

const CREADO: Usuario = { id: 1, nombre: 'Ana', correo: 'ana@test.com', rol: 'JUGADOR' };

describe('Registro', () => {
  let fixture: ComponentFixture<Registro>;
  let componente: Registro;
  let auth: jasmine.SpyObj<Pick<AuthService, 'registrar'>>;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthService', ['registrar']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [Registro],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    TestBed.overrideComponent(Registro, { set: { template: '' } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(Registro);
    componente = fixture.componentInstance;
  });

  function llenarFormulario(password = 'secreta', confirmar = 'secreta'): void {
    componente.form.setValue({
      nombre: 'Ana',
      correo: 'ana@test.com',
      password,
      confirmarPassword: confirmar,
    });
  }

  it('se crea con el formulario vacío y sin estados activos', () => {
    expect(componente).toBeTruthy();
    expect(componente.cargando()).toBeFalse();
    expect(componente.error()).toBeNull();
    expect(componente.exito()).toBeFalse();
    expect(componente.form.invalid).toBeTrue();
  });

  describe('validaciones del formulario', () => {
    it('exige los cuatro campos', () => {
      expect(componente.form.controls.nombre.hasError('required')).toBeTrue();
      expect(componente.form.controls.correo.hasError('required')).toBeTrue();
      expect(componente.form.controls.password.hasError('required')).toBeTrue();
      expect(componente.form.controls.confirmarPassword.hasError('required')).toBeTrue();
    });

    it('exige al menos 3 caracteres en el nombre', () => {
      componente.form.controls.nombre.setValue('Ab');

      expect(componente.form.controls.nombre.hasError('minlength')).toBeTrue();
    });

    it('exige al menos 6 caracteres en la contraseña', () => {
      componente.form.controls.password.setValue('12345');

      expect(componente.form.controls.password.hasError('minlength')).toBeTrue();
    });

    it('rechaza un correo mal formado', () => {
      componente.form.controls.correo.setValue('arroba-faltante');

      expect(componente.form.controls.correo.hasError('email')).toBeTrue();
    });
  });

  describe('passwordsIgualesValidator', () => {
    it('marca passwordsDistintos cuando las contraseñas no coinciden', () => {
      llenarFormulario('secreta', 'otra-cosa');

      expect(componente.form.hasError('passwordsDistintos')).toBeTrue();
      expect(componente.form.invalid).toBeTrue();
    });

    it('no marca error cuando las contraseñas coinciden', () => {
      llenarFormulario();

      expect(componente.form.hasError('passwordsDistintos')).toBeFalse();
      expect(componente.form.valid).toBeTrue();
    });

    it('no marca error mientras la confirmación sigue vacía', () => {
      componente.form.patchValue({ password: 'secreta', confirmarPassword: '' });

      expect(componente.form.hasError('passwordsDistintos')).toBeFalse();
    });
  });

  describe('onSubmit', () => {
    it('no llama al servicio si el formulario es inválido y marca los campos', () => {
      componente.onSubmit();

      expect(auth.registrar).not.toHaveBeenCalled();
      expect(componente.form.controls.nombre.touched).toBeTrue();
      expect(componente.form.controls.confirmarPassword.touched).toBeTrue();
    });

    it('envía solo nombre, correo y password (sin confirmarPassword)', () => {
      auth.registrar.and.returnValue(of(CREADO));
      llenarFormulario();

      componente.onSubmit();

      expect(auth.registrar).toHaveBeenCalledOnceWith({
        nombre: 'Ana',
        correo: 'ana@test.com',
        password: 'secreta',
      });
    });

    it('marca éxito y redirige a /login tras 1,5 s', fakeAsync(() => {
      auth.registrar.and.returnValue(of(CREADO));
      llenarFormulario();

      componente.onSubmit();

      expect(componente.exito()).toBeTrue();
      expect(componente.cargando()).toBeFalse();
      expect(router.navigate).not.toHaveBeenCalled();

      tick(1500);

      expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
    }));

    it('muestra mensaje específico cuando el correo ya existe (409)', () => {
      auth.registrar.and.returnValue(throwError(() => ({ status: 409 })));
      llenarFormulario();

      componente.onSubmit();

      expect(componente.error()).toBe('Ese correo ya está registrado.');
      expect(componente.exito()).toBeFalse();
      expect(componente.cargando()).toBeFalse();
    });

    it('muestra mensaje genérico ante cualquier otro error', () => {
      auth.registrar.and.returnValue(throwError(() => ({ status: 500 })));
      llenarFormulario();

      componente.onSubmit();

      expect(componente.error()).toBe('No se pudo completar el registro.');
    });

    it('muestra mensaje genérico si el error no trae status', () => {
      auth.registrar.and.returnValue(throwError(() => new Error('sin red')));
      llenarFormulario();

      componente.onSubmit();

      expect(componente.error()).toBe('No se pudo completar el registro.');
    });
  });
});
