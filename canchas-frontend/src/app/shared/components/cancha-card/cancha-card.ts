import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { Cancha } from '../../../core/models/cancha.model';

@Component({
  selector: 'app-cancha-card',
  imports: [FormsModule, ButtonModule, TagModule, RatingModule, CurrencyPipe, DecimalPipe],
  templateUrl: './cancha-card.html',
  styleUrl: './cancha-card.scss',
})
export class CanchaCard {
  cancha = input.required<Cancha>();
  reservar = output<Cancha>();
}
