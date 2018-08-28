export interface OptionsPaymentPlan {
    name: string;
    currencySymbol?: string;
    pricePerMonth: number;
    subtotal: number;
    discount?: number;
    usersAmount: number;
    total: number;
}
