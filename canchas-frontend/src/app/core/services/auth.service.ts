import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegistroRequest } from '../models/auth.model';
import { Usuario } from '../models/usuario.model';

const TOKEN_KEY = 'canchas_token';
const USUARIO_KEY = 'canchas_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioSignal = signal<Usuario | null>(this.leerUsuarioGuardado());

  readonly usuario = computed(() => this.usuarioSignal());
  readonly estaAutenticado = computed(() => this.usuarioSignal() !== null);
  readonly esAdministrador = computed(() => this.usuarioSignal()?.rol === 'ADMINISTRADOR');

  constructor(private http: HttpClient) {}

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/login`, credenciales)
      .pipe(
        tap((respuesta) => {
          localStorage.setItem(TOKEN_KEY, respuesta.token);
          localStorage.setItem(USUARIO_KEY, JSON.stringify(respuesta.usuario));
          this.usuarioSignal.set(respuesta.usuario);
        }),
      );
  }

  registrar(datos: RegistroRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${environment.apiUrl}/registro`, datos);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    this.usuarioSignal.set(null);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private leerUsuarioGuardado(): Usuario | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }
}
