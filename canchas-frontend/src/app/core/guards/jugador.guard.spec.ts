import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { jugadorGuard } from './jugador.guard';

describe('jugadorGuard', () => {
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
      jugadorGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('permite el acceso a quien no es administrador', () => {
    auth.esAdministrador.and.returnValue(false);

    expect(ejecutar()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('desvía al administrador hacia su panel de canchas', () => {
    auth.esAdministrador.and.returnValue(true);

    expect(ejecutar()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/admin/canchas']);
  });
});
