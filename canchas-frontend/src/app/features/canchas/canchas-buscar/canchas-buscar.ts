import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { CanchaService } from '../../../core/services/cancha.service';
import { Cancha, TIPOS_CANCHA } from '../../../core/models/cancha.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { CanchaCard } from '../../../shared/components/cancha-card/cancha-card';

@Component({
  selector: 'app-canchas-buscar',
  imports: [
    FormsModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    LoadingSpinner,
    CanchaCard,
  ],
  templateUrl: './canchas-buscar.html',
  styleUrl: './canchas-buscar.scss',
})
export class CanchasBuscar implements OnInit {
  private readonly canchaService = inject(CanchaService);
  private readonly router = inject(Router);

  readonly canchas = signal<Cancha[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly tipoSeleccionado = signal<string | null>(null);
  readonly precioMaximo = signal<number | null>(null);

  readonly tipos = TIPOS_CANCHA.map((tipo) => ({ label: this.etiquetaTipo(tipo), value: tipo }));

  readonly canchasFiltradas = computed(() => this.canchas().filter((cancha) => cancha.activa));

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.canchaService
      .buscarPublicas({
        tipo: this.tipoSeleccionado() ?? undefined,
        precioMax: this.precioMaximo() ?? undefined,
      })
      .subscribe({
        next: (canchas) => {
          this.canchas.set(canchas);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set(
            'Esta función depende de un endpoint público que el backend todavía no expone (GET /canchas/publicas). GET /canchas es solo para administradores.',
          );
        },
      });
  }

  aplicarFiltros(): void {
    this.cargar();
  }

  limpiarFiltros(): void {
    this.tipoSeleccionado.set(null);
    this.precioMaximo.set(null);
    this.cargar();
  }

  irAReservar(cancha: Cancha): void {
    this.router.navigate(['/canchas', cancha.id, 'reservar']);
  }

  private etiquetaTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      futbol5: 'Fútbol 5',
      futbol7: 'Fútbol 7',
      futbol11: 'Fútbol 11',
    };
    return mapa[tipo] ?? tipo;
  }
}
