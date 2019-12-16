/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

/** Application imports */
import { CodeBreakerAiComponent } from '@root/bank-code/products/codebreaker-ai/code-breaker-ai.component';
import { ProductsComponent } from '@root/bank-code/products/products.component';
import { BankPassComponent } from '@root/bank-code/products/bank-pass/bank-pass.component';
import { BankVaultComponent } from '@root/bank-code/products/bank-vault/bank-vault.component';
import { BankTrainerComponent } from '@root/bank-code/products/bank-trainer/bank-trainer.component';
import { BankAffiliateComponent } from '@root/bank-code/products/bank-affiliate/bank-affiliate.component';
import { BankCardsComponent } from '@root/bank-code/products/bank-cards/bank-cards.component';
import { BankGearComponent } from '@root/bank-code/products/bank-gear/bank-gear.component';
import { WhyTheyBuyComponent } from '@root/bank-code/products/why-they-buy/why-they-buy.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: ProductsComponent,
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
                    },
                    {
                        path: 'why-they-buy',
                        component: WhyTheyBuyComponent
                    }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class ProductsRoutingModule { }
