import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { CanchaService } from '../../../core/services/cancha.service';
import { Cancha, TIPOS_CANCHA } from '../../../core/models/cancha.model';

@Component({
  selector: 'app-cancha-form',
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MessageModule,
  ],
  templateUrl: './cancha-form.html',
  styleUrl: './cancha-form.scss',
})
export class CanchaForm {
  private readonly fb = inject(FormBuilder);
  private readonly canchaService = inject(CanchaService);

  visible = input<boolean>(false);
  cancha = input<Cancha | null>(null);

  guardado = output<void>();
  cancelado = output<void>();

  readonly tipos = TIPOS_CANCHA.map((tipo) => ({ label: this.etiquetaTipo(tipo), value: tipo }));

  guardando = false;
  errorGuardado: string | null = null;

  private dialogYaAbierto = false;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    tipo: ['futbol5', [Validators.required]],
    precio_hora: [20, [Validators.required, Validators.min(0.01)]],
    hora_apertura: ['08:00', [Validators.required]],
    hora_cierre: ['22:00', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const visible = this.visible();
      const actual = this.cancha();

      if (visible && !this.dialogYaAbierto) {
        if (actual) {
          this.form.reset({
            nombre: actual.nombre,
            tipo: actual.tipo,
            precio_hora: actual.precio_hora,
            hora_apertura: actual.hora_apertura,
            hora_cierre: actual.hora_cierre,
          });
        } else {
          this.form.reset({
            nombre: '',
            tipo: 'futbol5',
            precio_hora: 20,
            hora_apertura: '08:00',
            hora_cierre: '22:00',
          });
        }
        this.errorGuardado = null;
      }

      this.dialogYaAbierto = visible;
    });
  }

  get esEdicion(): boolean {
    return this.cancha() !== null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorGuardado = null;
    const datos = this.form.getRawValue();

    const peticion = this.esEdicion
      ? this.canchaService.editar(this.cancha()!.id, datos)
      : this.canchaService.crear(datos);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.guardado.emit();
      },
      error: (err) => {
        this.guardando = false;
        this.errorGuardado =
          err?.error?.detail ?? 'No se pudo guardar la cancha. Verifica los datos ingresados.';
      },
    });
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
