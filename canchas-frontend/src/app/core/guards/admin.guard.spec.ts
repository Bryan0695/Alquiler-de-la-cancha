import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let auth: jasmine.SpyObj<Pick<AuthService, 'esAdministrador'>>;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['esAdministrador']);
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
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('permite el acceso a un administrador', () => {
    auth.esAdministrador.and.returnValue(true);

    expect(ejecutar()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('bloquea a un jugador y lo redirige a /canchas', () => {
    auth.esAdministrador.and.returnValue(false);

    expect(ejecutar()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/canchas']);
  });

  it('bloquea a un visitante sin sesión', () => {
    auth.esAdministrador.and.returnValue(false);

    expect(ejecutar()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/canchas']);
  });
});
