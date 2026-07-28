import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/services/auth.service';

interface ItemMenu {
  etiqueta: string;
  ruta: string;
  icono: string;
  soloAdmin?: boolean;
  soloJugador?: boolean;
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, TooltipModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly items: ItemMenu[] = [
    { etiqueta: 'Buscar canchas', ruta: '/canchas', icono: 'pi pi-search', soloJugador: true },
    { etiqueta: 'Mis reservas', ruta: '/reservas', icono: 'pi pi-calendar', soloJugador: true },
    { etiqueta: 'Gestionar canchas', ruta: '/admin/canchas', icono: 'pi pi-cog', soloAdmin: true },
    { etiqueta: 'Consultar reservas', ruta: '/admin/reservas', icono: 'pi pi-list', soloAdmin: true },
  ];

  readonly usuario = this.auth.usuario;

  readonly menuVisible = computed(() => {
    const esAdmin = this.auth.esAdministrador();
    return this.items.filter((item) => {
      if (item.soloAdmin && !esAdmin) return false;
      if (item.soloJugador && esAdmin) return false;
      return true;
    });
  });

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
