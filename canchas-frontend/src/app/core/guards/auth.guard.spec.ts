import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let auth: jasmine.SpyObj<Pick<AuthService, 'estaAutenticado'>>;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['estaAutenticado']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  function ejecutar(): boolean | unknown {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('permite el acceso a un usuario autenticado', () => {
    auth.estaAutenticado.and.returnValue(true);

    expect(ejecutar()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirige a /login cuando no hay sesión', () => {
    auth.estaAutenticado.and.returnValue(false);

    expect(ejecutar()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
  });
});
