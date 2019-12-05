/** Core imports */
import { Injectable, NgModule } from '@angular/core';
import { RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { CodeBreakerAiComponent } from '@root/bank-code/products/codebreaker-ai/code-breaker-ai.component';
import { ProductsComponent } from '@root/bank-code/products/products.component';
import { BankPassComponent } from '@root/bank-code/products/bank-pass/bank-pass.component';
import { BankVaultComponent } from '@root/bank-code/products/bank-vault/bank-vault.component';
import { BankTrainerComponent } from '@root/bank-code/products/bank-trainer/bank-trainer.component';
import { BankAffiliateComponent } from '@root/bank-code/products/bank-affiliate/bank-affiliate.component';
import { BankCardsComponent } from '@root/bank-code/products/bank-cards/bank-cards.component';
import { BankGearComponent } from '@root/bank-code/products/bank-gear/bank-gear.component';
import { ProductsService } from './products.service';

@Injectable()
export class SubscriptionsResolver implements CanActivateChild {
    constructor(
        private productsService: ProductsService
    ) {}

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.productsService.subscriptions ?
            of(true) : this.productsService.loadSubscriptions().pipe(map(Boolean));
    }
}

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: ProductsComponent,
                canActivateChild: [ SubscriptionsResolver ],
                children: [
                    {
                        path: '',
                        redirectTo: 'codebreaker-ai',
                        pathMatch: 'full',
                    },
                    {
                        path: 'codebreaker-ai',
                        component: CodeBreakerAiComponent
                    },
                    {
                        path: 'bank-pass',
                        component: BankPassComponent
                    },
                    {
                        path: 'bank-vault',
                        component: BankVaultComponent
                    },
                    {
                        path: 'bank-trainer',
                        component: BankTrainerComponent
                    },
                    {
                        path: 'bank-affiliate',
                        component: BankAffiliateComponent
                    },
                    {
                        path: 'bank-cards',
                        component: BankCardsComponent
                    },
                    {
                        path: 'bank-gear',
                        component: BankGearComponent
                    }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ],
    providers: [
        SubscriptionsResolver
    ]
})
export class ProductsRoutingModule { }