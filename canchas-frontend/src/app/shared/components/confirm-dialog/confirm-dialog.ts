import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogModule, ButtonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  visible = input<boolean>(false);
  titulo = input<string>('Confirmar acción');
  mensaje = input<string>('¿Deseas continuar?');
  detalle = input<string | null>(null);
  textoConfirmar = input<string>('Sí, eliminar');
  textoCancelar = input<string>('Cancelar');
  severidad = input<'danger' | 'primary'>('danger');

  confirmar = output<void>();
  cancelar = output<void>();
}
