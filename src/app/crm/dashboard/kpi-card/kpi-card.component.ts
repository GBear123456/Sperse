import { Component, Input } from '@angular/core';

export interface KpiCardData {
  title: string;
  value: string | number;
  icon: string;
  cardType: 'gross-earnings' | 'customers' | 'subscriptions' | 'cancels';
  showCurrencySelector?: boolean;
  currencyText?: string;
  statusBadge?: string;
}

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.less']
})
export class KpiCardComponent {
  @Input() cardData: KpiCardData;

  get formattedValue(): string {
    if (this.cardData.cardType === 'gross-earnings') {
      return `$${Number(this.cardData.value).toLocaleString()} USD`;
    }
    return Number(this.cardData.value).toLocaleString();
  }

  get showCurrencySelector(): boolean {
    return this.cardData.showCurrencySelector || false;
  }

  get showStatusBadge(): boolean {
    return !!this.cardData.statusBadge;
  }
}
