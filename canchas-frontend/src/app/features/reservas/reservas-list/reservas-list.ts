import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CanchaService } from '../../../core/services/cancha.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { CalificacionService } from '../../../core/services/calificacion.service';
import { Reserva } from '../../../core/models/reserva.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { CalificarDialog } from '../../../shared/components/calificar-dialog/calificar-dialog';

interface ReservaConCancha extends Reserva {
  cancha_nombre: string;
}

@Component({
  selector: 'app-reservas-list',
  imports: [
    TableModule,
    TagModule,
    ButtonModule,
    MessageModule,
    ToastModule,
    CurrencyPipe,
    LoadingSpinner,
    CalificarDialog,
  ],
  providers: [MessageService],
  templateUrl: './reservas-list.html',
  styleUrl: './reservas-list.scss',
})
export class ReservasList implements OnInit {
  private readonly reservaService = inject(ReservaService);
  private readonly canchaService = inject(CanchaService);
  private readonly calificacionService = inject(CalificacionService);
  private readonly messageService = inject(MessageService);

  readonly reservas = signal<ReservaConCancha[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly dialogoVisible = signal(false);
  readonly reservaACalificar = signal<ReservaConCancha | null>(null);
  readonly guardandoCalificacion = signal(false);
  readonly errorCalificacion = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.reservaService.listarMisReservas().subscribe({
      next: (reservas) => this.resolverNombresCanchas(reservas),
      error: () => {
        this.cargando.set(false);
        this.error.set(
          'No se pudieron cargar tus reservas. Verifica que el backend esté corriendo (GET /reservas).',
        );
      },
    });
  }

  private resolverNombresCanchas(reservas: Reserva[]): void {
    if (reservas.length === 0) {
      this.reservas.set([]);
      this.cargando.set(false);
      return;
    }

    const idsUnicos = [...new Set(reservas.map((r) => r.cancha_id))];
    const peticiones = idsUnicos.map((id) =>
      this.canchaService.obtener(id).pipe(map((cancha) => [id, cancha.nombre] as const)),
    );

    forkJoin(peticiones).subscribe({
      next: (pares) => {
        const nombresPorId = new Map(pares);
        this.reservas.set(
          reservas.map((r) => ({ ...r, cancha_nombre: nombresPorId.get(r.cancha_id) ?? `Cancha #${r.cancha_id}` })),
        );
        this.cargando.set(false);
      },
      error: () => {
        this.reservas.set(reservas.map((r) => ({ ...r, cancha_nombre: `Cancha #${r.cancha_id}` })));
        this.cargando.set(false);
      },
    });
  }

  puedeCalificar(reserva: ReservaConCancha): boolean {
    return (reserva.estado === 'CONFIRMADA' || reserva.estado === 'COMPLETADA') && !reserva.calificacion;
  }

  abrirCalificar(reserva: ReservaConCancha): void {
    this.reservaACalificar.set(reserva);
    this.errorCalificacion.set(null);
    this.dialogoVisible.set(true);
  }

  onCalificar(datos: { puntaje: number; comentario: string }): void {
    const reserva = this.reservaACalificar();
    if (!reserva) return;

    this.guardandoCalificacion.set(true);
    this.errorCalificacion.set(null);

    this.calificacionService.calificar(reserva.cancha_id, reserva.id, datos.puntaje, datos.comentario).subscribe({
      next: (calificacion) => {
        this.guardandoCalificacion.set(false);
        this.dialogoVisible.set(false);
        this.reservas.update((lista) =>
          lista.map((r) => (r.id === reserva.id ? { ...r, calificacion } : r)),
        );
        this.messageService.add({ severity: 'success', summary: 'Gracias', detail: '¡Calificación enviada!' });
      },
      error: () => {
        this.guardandoCalificacion.set(false);
        this.errorCalificacion.set('No se pudo enviar la calificación. Intenta nuevamente.');
      },
    });
  }

  severidadEstado(estado: string): 'success' | 'warn' | 'info' {
    if (estado === 'CONFIRMADA' || estado === 'COMPLETADA') return 'success';
    return 'info';
  }

  severidadPago(estado: string | undefined): 'success' | 'warn' | 'danger' {
    if (estado === 'PAGADO') return 'success';
    if (estado === 'RECHAZADO') return 'danger';
    return 'warn';
  }
}
