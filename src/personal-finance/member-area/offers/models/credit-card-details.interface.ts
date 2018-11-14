export class CreditCardDetails {
    id: number;
    cardName: string;
    bankName: string;
    details: string[];
    apr: string;
    penaltyApr: string;
    advancedApr: string;
    pros: string[];
    cons: string[];
    recommendedCreditScore: {
        min: number;
        max: number;
        name: string
    };
    rewardRate: string;
    annualFee: string;
    introApr: string;
}
