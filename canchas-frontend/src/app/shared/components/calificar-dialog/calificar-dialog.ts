import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-calificar-dialog',
  imports: [FormsModule, DialogModule, ButtonModule, RatingModule, TextareaModule],
  templateUrl: './calificar-dialog.html',
  styleUrl: './calificar-dialog.scss',
})
export class CalificarDialog {
  visible = input<boolean>(false);
  canchaNombre = input<string>('');
  guardando = input<boolean>(false);
  error = input<string | null>(null);

  calificar = output<{ puntaje: number; comentario: string }>();
  cancelar = output<void>();

  readonly puntaje = signal<number>(0);
  readonly comentario = signal('');

  constructor() {
    let abiertoAntes = false;
    effect(() => {
      const abierto = this.visible();
      if (abierto && !abiertoAntes) {
        this.puntaje.set(0);
        this.comentario.set('');
      }
      abiertoAntes = abierto;
    });
  }

  onConfirmar(): void {
    if (this.puntaje() < 1) return;
    this.calificar.emit({ puntaje: this.puntaje(), comentario: this.comentario() });
  }
}
