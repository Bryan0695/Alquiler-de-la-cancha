import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let auth: jasmine.SpyObj<Pick<AuthService, 'logout'>>;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;
  const peticion = new HttpRequest('GET', '/reservas');

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['logout']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  function interceptar(next: HttpHandlerFn): Observable<unknown> {
    return TestBed.runInInjectionContext(() => errorInterceptor(peticion, next));
  }

  function fallaCon(status: number): HttpHandlerFn {
    return () => throwError(() => new HttpErrorResponse({ status, url: '/reservas' }));
  }

  it('deja pasar las respuestas exitosas sin efectos secundarios', () => {
    let recibido: unknown;

    interceptar(() => of(new HttpResponse({ status: 200 }))).subscribe((r) => (recibido = r));

    expect(recibido).toBeInstanceOf(HttpResponse);
    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('cierra la sesión y redirige a /login ante un 401', () => {
    let error: HttpErrorResponse | undefined;

    interceptar(fallaCon(401)).subscribe({ error: (e) => (error = e) });

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
    expect(error?.status).toBe(401);
  });

  it('no cierra la sesión ante un 403', () => {
    interceptar(fallaCon(403)).subscribe({ error: () => undefined });

    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('no cierra la sesión ante un 404', () => {
    interceptar(fallaCon(404)).subscribe({ error: () => undefined });

    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('no cierra la sesión ante un 500', () => {
    interceptar(fallaCon(500)).subscribe({ error: () => undefined });

    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('siempre repropaga el error para que el llamador pueda manejarlo', () => {
    let error: HttpErrorResponse | undefined;
    let completo = false;

    interceptar(fallaCon(409)).subscribe({
      error: (e) => (error = e),
      complete: () => (completo = true),
    });

    expect(error?.status).toBe(409);
    expect(completo).toBeFalse();
  });
});
