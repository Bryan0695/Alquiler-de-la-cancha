import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { CanchaService } from '../../../core/services/cancha.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { Cancha } from '../../../core/models/cancha.model';
import { Horario, Reserva } from '../../../core/models/reserva.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

function aFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

type Paso = 'horario' | 'confirmar' | 'listo';

@Component({
  selector: 'app-reserva-flow',
  imports: [
    FormsModule,
    ButtonModule,
    DatePickerModule,
    TagModule,
    MessageModule,
    CurrencyPipe,
    LoadingSpinner,
  ],
  templateUrl: './reserva-flow.html',
  styleUrl: './reserva-flow.scss',
})
export class ReservaFlow implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly canchaService = inject(CanchaService);
  private readonly reservaService = inject(ReservaService);

  private readonly canchaId = Number(this.route.snapshot.paramMap.get('id'));

  readonly cancha = signal<Cancha | null>(null);
  readonly cargandoCancha = signal(true);

  readonly fecha = signal<Date>(new Date());
  readonly horarios = signal<Horario[]>([]);
  readonly cargandoHorarios = signal(false);
  readonly errorHorarios = signal<string | null>(null);

  readonly horarioSeleccionado = signal<Horario | null>(null);
  readonly paso = signal<Paso>('horario');

  readonly confirmando = signal(false);
  readonly errorConfirmar = signal<string | null>(null);
  readonly reservaCreada = signal<Reserva | null>(null);

  readonly totalEstimado = computed(() => this.cancha()?.precio_hora ?? 0);

  ngOnInit(): void {
    this.canchaService.obtener(this.canchaId).subscribe({
      next: (cancha) => {
        this.cancha.set(cancha);
        this.cargandoCancha.set(false);
        this.cargarHorarios();
      },
      error: () => this.cargandoCancha.set(false),
    });
  }

  onFechaCambiada(fecha: Date): void {
    this.fecha.set(fecha);
    this.horarioSeleccionado.set(null);
    this.cargarHorarios();
  }

  cargarHorarios(): void {
    this.cargandoHorarios.set(true);
    this.errorHorarios.set(null);
    const fechaISO = aFechaISO(this.fecha());

    this.reservaService.obtenerDisponibilidad(this.canchaId, fechaISO).subscribe({
      next: (horarios) => {
        this.horarios.set(horarios);
        this.cargandoHorarios.set(false);
      },
      error: () => {
        this.cargandoHorarios.set(false);
        this.errorHorarios.set(
          'Esta función depende de un endpoint que el backend todavía no expone (ver ReservaService).',
        );
      },
    });
  }

  seleccionarHorario(horario: Horario): void {
    if (horario.estado === 'OCUPADO') return;
    this.horarioSeleccionado.set(horario);
    this.paso.set('confirmar');
  }

  confirmarYPagar(): void {
    const horario = this.horarioSeleccionado();
    if (!horario) return;

    this.confirmando.set(true);
    this.errorConfirmar.set(null);

    this.reservaService.reservar(this.canchaId, horario.id).subscribe({
      next: (reserva) => {
        this.confirmando.set(false);
        this.reservaCreada.set(reserva);
        this.paso.set('listo');
      },
      error: (err) => {
        this.confirmando.set(false);
        if (err?.status === 409) {
          this.errorConfirmar.set('Ese horario ya fue tomado por otro usuario. Elige otro.');
          this.paso.set('horario');
          this.cargarHorarios();
        } else {
          this.errorConfirmar.set('No se pudo completar la reserva. Intenta nuevamente.');
        }
      },
    });
  }

  volverAHorarios(): void {
    this.paso.set('horario');
  }

  volverABuscar(): void {
    this.router.navigate(['/canchas']);
  }
}
