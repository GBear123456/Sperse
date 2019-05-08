export class Currency {
    value: string;
    caption: string;
}

export interface State {
    entities: Currency[];
    selectedCurrencyId: string;
}

export const initialState: State = {
    entities: [
        { value: 'EUR', caption: '€ EUR European Euro' },
        { value: 'GBP', caption: '£ GBP British Pound' },
        { value: 'INR', caption: '₹ INR Indian Rupee' },
        { value: 'JPY', caption: '¥ JPY Japanese Yen' },
        { value: 'ILS', caption: '₪ ILS Israeli Shekel' },
        { value: 'UAH', caption: '‎₴ UAH Ukrainian Hryvnia' },
        { value: 'RUB', caption: '₽ RUB Russian Ruble' },
        { value: 'CHF', caption: 'C CHF Swiss Franc' },
        { value: 'SGD', caption: '$ SGD Singapore Dollar' },
        { value: 'AUD', caption: '$ AUD Australian Dollar' },
        { value: 'CAD', caption: '$ CAD Canadian Dollar' },
        { value: 'HKD', caption: '$ HKD Hong Kong Dollar' },
        { value: 'MXN', caption: '$ MXN Mexican Peso' },
        { value: 'NZD', caption: '$ NZD New Zealand Dollar' },
        { value: 'USD', caption: '$ USD US Dollar' }
    ],
    selectedCurrencyId: 'USD'
};
