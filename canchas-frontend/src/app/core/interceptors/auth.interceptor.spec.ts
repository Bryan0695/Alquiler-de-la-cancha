import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let auth: jasmine.SpyObj<Pick<AuthService, 'obtenerToken'>>;
  let next: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['obtenerToken']);
    next = jasmine
      .createSpy<HttpHandlerFn>('next')
      .and.returnValue(of(new HttpResponse({ status: 200 })));

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }],
    });
  });

  function interceptar(req: HttpRequest<unknown>): Observable<unknown> {
    return TestBed.runInInjectionContext(() => authInterceptor(req, next));
  }

  it('agrega el header Authorization cuando hay token', () => {
    auth.obtenerToken.and.returnValue('token-123');
    const original = new HttpRequest('GET', '/canchas');

    interceptar(original).subscribe();

    const enviada = next.calls.mostRecent().args[0];
    expect(enviada.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('no muta la petición original al clonarla', () => {
    auth.obtenerToken.and.returnValue('token-123');
    const original = new HttpRequest('GET', '/canchas');

    interceptar(original).subscribe();

    expect(original.headers.has('Authorization')).toBeFalse();
    expect(next.calls.mostRecent().args[0]).not.toBe(original);
  });

  it('deja pasar la petición sin tocarla cuando no hay token', () => {
    auth.obtenerToken.and.returnValue(null);
    const original = new HttpRequest('GET', '/canchas/publicas');

    interceptar(original).subscribe();

    expect(next).toHaveBeenCalledOnceWith(original);
    expect(next.calls.mostRecent().args[0].headers.has('Authorization')).toBeFalse();
  });

  it('trata el token vacío como ausencia de token', () => {
    auth.obtenerToken.and.returnValue('');
    const original = new HttpRequest('GET', '/canchas');

    interceptar(original).subscribe();

    expect(next).toHaveBeenCalledOnceWith(original);
  });

  it('conserva método y cuerpo de la petición', () => {
    auth.obtenerToken.and.returnValue('token-123');
    const original = new HttpRequest('POST', '/reservas', { cancha_id: 1, horario_id: 2 });

    interceptar(original).subscribe();

    const enviada = next.calls.mostRecent().args[0];
    expect(enviada.method).toBe('POST');
    expect(enviada.body).toEqual({ cancha_id: 1, horario_id: 2 });
  });

  it('devuelve la respuesta que emite el siguiente manejador', () => {
    auth.obtenerToken.and.returnValue('token-123');
    let recibido: unknown;

    interceptar(new HttpRequest('GET', '/canchas')).subscribe((r) => (recibido = r));

    expect(recibido).toBeInstanceOf(HttpResponse);
  });
});
