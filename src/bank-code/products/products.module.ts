import { NgModule } from '@angular/core';

import { ProductsComponent } from './products.component';
import { ProductsRoutingModule } from '@root/bank-code/products/products-routing.module';
import { CodeBreakerAiComponent } from '@root/bank-code/products/codebreaker-ai/code-breaker-ai.component';
import { CommonModule } from '@angular/common';
import { BankAffiliateComponent } from '@root/bank-code/products/bank-affiliate/bank-affiliate.component';
import { BankGearComponent } from '@root/bank-code/products/bank-gear/bank-gear.component';
import { BankPassComponent } from '@root/bank-code/products/bank-pass/bank-pass.component';
import { BankTrainerComponent } from '@root/bank-code/products/bank-trainer/bank-trainer.component';
import { BankVaultComponent } from '@root/bank-code/products/bank-vault/bank-vault.component';
import { BankCardsComponent } from '@root/bank-code/products/bank-cards/bank-cards.component';
import { SidebarModule } from '@root/bank-code/shared/sidebar/sidebar.module';

@NgModule({
    imports: [
        CommonModule,
        ProductsRoutingModule,
        SidebarModule
    ],
    exports: [],
    declarations: [
        CodeBreakerAiComponent,
        ProductsComponent,
        BankAffiliateComponent,
        BankCardsComponent,
        BankGearComponent,
        BankPassComponent,
        BankTrainerComponent,
        BankVaultComponent
    ],
    providers: [],
})
export class ProductsModule {}
