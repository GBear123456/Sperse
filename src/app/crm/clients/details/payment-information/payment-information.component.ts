import { Component, ChangeDetectionStrategy, OnInit, Injector } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Observable, of } from 'rxjs';
import { concatAll, first, pluck, map } from 'rxjs/operators';
import * as moment from 'moment';

class Transaction {
    date: moment;
    amount: number;
}

class PaymentMethod {
    iconName: string;
    name: string;
    expiration: string;
    active?: boolean;
    issues?: string[];
}

@Component({
    selector: 'payment-information',
    templateUrl: './payment-information.component.html',
    styleUrls: ['./payment-information.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentInformationComponent extends AppComponentBase implements OnInit {
    warningMessage$: Observable<string>;
    lastPaymentDate: string;
    lastPaymentAmount: number;
    amountCurrency = '$';
    balanceAmount$: Observable<number>;
    transactions$: Observable<Transaction[]>;
    paymentMethods$: Observable<PaymentMethod[]>;
    allTransactionsAreShowen = false;
    constructor(
        injector: Injector
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.balanceAmount$ = of(0);
        this.transactions$ = of([
            {
                date: moment('2017-07-01'),
                amount: 0
            },
            {
                date: moment('2017-06-01'),
                amount: 100
            },
            {
                date: moment('2017-06-01'),
                amount: 97.40
            }
        ]);
        this.paymentMethods$ = of([
            {
                iconName: 'visa',
                name: 'Visa ****2342',
                expiration: 'Expires 09/19',
                active: true,
                issues: [
                    'We are unable to process your Visa***2432 because the account has been closed.  Try adding a new card.'
                ]
            },
            {
                iconName: 'mastercard',
                name: 'Visa ****2036',
                expiration: 'Expires 11/21'
            },
            {
                iconName: 'visa',
                name: 'Visa ****2036',
                expiration: 'Expires 11/21'
            }
        ]);
        this.warningMessage$ = this.paymentMethods$.pipe(
            concatAll(),
            pluck('issues'),
            map(issues => issues[0]),
            first()
        );
    }

    updateCard() {}

    viewAllTransactions() {}

    addNewPaymentMethod() {}

    editPaymentMethod() {}

    removePaymentMethod() {}
}
