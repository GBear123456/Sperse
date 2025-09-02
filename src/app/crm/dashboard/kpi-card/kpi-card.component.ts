import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface KpiCardData {
  title: string;
  value: string | number;
  icon: string;
  cardType: 'gross-earnings' | 'customers' | 'subscriptions' | 'cancels';
  showCurrencySelector?: boolean;
  currencyText?: string;
  statusBadge?: string;
  selectedCurrency?: any;
  availableCurrencies?: any[];
  convertedValue?: number;
  isLoading?: boolean;
  currencyChanged?: boolean;
}

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.less']
})
export class KpiCardComponent {
  @Input() cardData: KpiCardData;
  @Output() currencyChange = new EventEmitter<any>();

  get formattedValue(): string {
    if (this.cardData.cardType === 'gross-earnings') {
      const currency = this.cardData.selectedCurrency;
      const value = this.cardData.convertedValue || this.cardData.value;
      
      if (currency && currency.symbol) {
        return `${currency.symbol}${Number(value).toLocaleString()} ${currency.id}`;
      }
      return `$${Number(value).toLocaleString()} USD`;
    }
    return Number(this.cardData.value).toLocaleString();
  }

  get showCurrencySelector(): boolean {
    return this.cardData.showCurrencySelector || false;
  }

  get showStatusBadge(): boolean {
    return !!this.cardData.statusBadge;
  }

  get currentCurrencyText(): string {
    if (this.cardData.selectedCurrency) {
      const currency = this.cardData.selectedCurrency;
      return `${currency.id} - ${currency.name}`;
    }
    return this.cardData.currencyText || 'USD - US Dollar';
  }

  get isLoading(): boolean {
    return this.cardData.isLoading || false;
  }

  get currencyChanged(): boolean {
    return this.cardData.currencyChanged || false;
  }

  onCurrencyClick(): void {
    if (this.showCurrencySelector && this.cardData.availableCurrencies && !this.isLoading) {
      if (this.cardData.availableCurrencies.length === 0) {
        console.warn('No currencies available for selection');
        return;
      }
      
      this.currencyChange.emit({
        currentCurrency: this.cardData.selectedCurrency,
        availableCurrencies: this.cardData.availableCurrencies
      });
    }
  }
}
