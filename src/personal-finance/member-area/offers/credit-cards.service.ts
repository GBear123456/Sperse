import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { CreditCard } from '@root/personal-finance/member-area/offers/models/credit-card.interface';
import { CreditCardDetails } from '@root/personal-finance/member-area/offers/models/credit-card-details.interface';

@Injectable()
export class CreditCardsService {
    displayedCards: CreditCard[];
    cardDetails = {
        '1': {
            id: 1,
            cardName: 'Travel Rewards',
            bankName: 'Bank America',
            details: [
                'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi.',
                'Sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.',
                'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus',
                'Omnis voluptas assumenda est, omnis dolor repellendus.',
                'Sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.'
            ],
            apr: '17.49%',
            penaltyApr: '19.20%',
            advancedApr: '23.49%',
            pros: [
                'High rewards rates',
                'No foreign transaction fee'
            ],
            cons: [
                'Has anual fees'
            ],
            recommendedCreditScore: {
                min: 650,
                max: 850,
                name: 'Excelent'
            },
            rewardRate: '16%',
            annualFee: '$0 first year, $59 after',
            introApr: 'N/A'
        },
        '2': {
            id: 2,
            cardName: 'Quicksliver One',
            bankName: 'Capital One',
            details: [
                'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi.',
                'Sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.',
                'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus',
                'Omnis voluptas assumenda est, omnis dolor repellendus.',
                'Sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.'
            ],
            apr: '17.49%',
            penaltyApr: '19.20%',
            advancedApr: '23.49%',
            pros: [
                'High rewards rates',
                'No foreign transaction fee'
            ],
            cons: [
                'Has anual fees'
            ],
            recommendedCreditScore: {
                min: 450,
                max: 650,
                name: 'Good'
            },
            rewardRate: '16%',
            annualFee: '$0 first year, $59 after',
            introApr: 'N/A'
        }
    };

    getCreditCards(): Observable<CreditCard[]> {
        return of([
            {
                id: 0,
                bankName: 'Bank of America',
                cardName: 'BankAmercard',
                reviewsAmount: 765,
                annualFee: 'None',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 3,
                imageName: 'bankAmericard',
                type: 'Small business',
                category: 'Hotel points',
                network: 'AmEx'
            },
            {
                id: 1,
                bankName: 'Capital One',
                cardName: 'Quicksilver One',
                reviewsAmount: 152,
                annualFee: '$45',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 3,
                imageName: 'quickSilver',
                type: 'Personal',
                category: 'Cashback',
                network: 'Diners Club'
            },
            {
                id: 2,
                bankName: 'City Bank',
                cardName: 'Adbantage',
                reviewsAmount: 765,
                annualFee: 'None',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 4,
                imageName: 'advantage',
                type: 'Small business',
                category: 'Airline miles',
                network: 'Master'
            },
            {
                id: 3,
                bankName: 'City Bank',
                cardName: 'Adbantage',
                reviewsAmount: 765,
                annualFee: 'None',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 4,
                imageName: 'advantage',
                type: 'Small business',
                category: 'Airline miles',
                network: 'AmEx'
            },
            {
                id: 4,
                bankName: 'Capital One',
                cardName: 'Quicksilver One',
                reviewsAmount: 152,
                annualFee: '$45',
                rewardsRate: '1.5% cashback',
                rewardsBonus: '$100',
                apr: '5.5%',
                rating: 3,
                imageName: 'quickSilver',
                type: 'Personal',
                category: 'Cashback',
                network: 'Visa'
            },
        ]).pipe(delay(1000));
    }

    getCreditCardDetails(cardId: number): Observable<CreditCardDetails> {

        console.log(this.cardDetails[cardId.toString()]);

        return of(this.cardDetails[cardId.toString()]).pipe(delay(500), tap(x => console.log('card details in service', x)));
    }
}
