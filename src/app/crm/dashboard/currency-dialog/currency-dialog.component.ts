import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';

export interface CurrencyDialogData {
  currencies: any[];
  selectedCurrency: any;
}

@Component({
  selector: 'app-currency-dialog',
  templateUrl: './currency-dialog.component.html',
  styleUrls: ['./currency-dialog.component.less']
})
export class CurrencyDialogComponent implements OnInit {
  searchControl = new FormControl('');
  filteredCurrencies: any[] = [];
  selectedCurrency: any;

  constructor(
    public dialogRef: MatDialogRef<CurrencyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CurrencyDialogData
  ) {
    this.selectedCurrency = data.selectedCurrency;
    this.filteredCurrencies = [...data.currencies];
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(searchTerm => {
      this.filterCurrencies(searchTerm);
    });
  }

  filterCurrencies(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredCurrencies = [...this.data.currencies];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredCurrencies = this.data.currencies.filter(currency => 
        currency.id.toLowerCase().includes(term) ||
        currency.name.toLowerCase().includes(term) ||
        currency.symbol.toLowerCase().includes(term)
      );
    }
  }

  selectCurrency(currency: any): void {
    this.selectedCurrency = currency;
    this.dialogRef.close(currency);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  trackByCurrency(index: number, currency: any): string {
    return currency.id;
  }
}
