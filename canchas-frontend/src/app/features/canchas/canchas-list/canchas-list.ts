import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CanchaService } from '../../../core/services/cancha.service';
import { Cancha } from '../../../core/models/cancha.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { CanchaForm } from '../cancha-form/cancha-form';

@Component({
  selector: 'app-canchas-list',
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    TooltipModule,
    CurrencyPipe,
    LoadingSpinner,
    ConfirmDialog,
    CanchaForm,
  ],
  providers: [MessageService],
  templateUrl: './canchas-list.html',
  styleUrl: './canchas-list.scss',
})
export class CanchasList implements OnInit {
  readonly canchas = signal<Cancha[]>([]);
  readonly cargando = signal(false);

  readonly formularioVisible = signal(false);
  readonly canchaEnEdicion = signal<Cancha | null>(null);

  readonly confirmacionVisible = signal(false);
  readonly canchaAEliminar = signal<Cancha | null>(null);

  constructor(private canchaService: CanchaService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.canchaService.listar().subscribe({
      next: (canchas) => {
        this.canchas.set(canchas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las canchas. Verifica que el backend esté corriendo.',
        });
      },
    });
  }

  abrirCrear(): void {
    this.canchaEnEdicion.set(null);
    this.formularioVisible.set(true);
  }

  abrirEditar(cancha: Cancha): void {
    this.canchaEnEdicion.set(cancha);
    this.formularioVisible.set(true);
  }

  onGuardado(): void {
    this.formularioVisible.set(false);
    this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Cancha guardada correctamente.' });
    this.cargar();
  }

  pedirConfirmacionEliminar(cancha: Cancha): void {
    this.canchaAEliminar.set(cancha);
    this.confirmacionVisible.set(true);
  }

  confirmarEliminar(): void {
    const cancha = this.canchaAEliminar();
    if (!cancha) return;

    this.canchaService.eliminar(cancha.id).subscribe({
      next: () => {
        this.confirmacionVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: cancha.nombre });
        this.cargar();
      },
      error: (err) => {
        this.confirmacionVisible.set(false);
        const detalle =
          err?.status === 409
            ? 'Esta cancha tiene reservas activas y no se puede eliminar.'
            : 'No se pudo eliminar la cancha.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: detalle });
      },
    });
  }
}
