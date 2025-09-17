export interface SpreedlyExpressOptions {
    amount: string;
    company_name: string;
    sidebar_top_description?: string;
    sidebar_bottom_description?: string;
    full_name?: string;
}

export interface SpreedlyExpressPaymentMethodParams {
    email?: string;
    country?: string;
}