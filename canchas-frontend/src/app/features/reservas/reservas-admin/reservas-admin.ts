import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ReservaService } from '../../../core/services/reserva.service';
import { ReservaAdminView } from '../../../core/models/reserva.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

function haceDias(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha;
}

function aISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

@Component({
  selector: 'app-reservas-admin',
  imports: [
    FormsModule,
    ButtonModule,
    DatePickerModule,
    TableModule,
    TagModule,
    MessageModule,
    CurrencyPipe,
    LoadingSpinner,
  ],
  templateUrl: './reservas-admin.html',
  styleUrl: './reservas-admin.scss',
})
export class ReservasAdmin implements OnInit {
  private readonly reservaService = inject(ReservaService);

  readonly desde = signal<Date>(haceDias(30));
  readonly hasta = signal<Date>(new Date());

  readonly reservas = signal<ReservaAdminView[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.reservaService.listarReservasAdmin(aISO(this.desde()), aISO(this.hasta())).subscribe({
      next: (reservas) => {
        this.reservas.set(reservas);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set(
          'Esta función depende de un endpoint que el backend todavía no expone (ver ReservaService.listarReservasAdmin).',
        );
      },
    });
  }

  severidadPago(estado: string): 'success' | 'warn' | 'danger' {
    if (estado === 'PAGADO') return 'success';
    if (estado === 'RECHAZADO') return 'danger';
    return 'warn';
  }
}
