import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonalFinanceCommonModule } from '../../shared/common/personal-finance-common.module';
import { LayoutModule } from '../../shared/layout/layout.module';

import { CreditResourcesComponent } from './credit-resources.component';
import { IdentityProtectionComponent } from './identity-protection/identity-protection.component';
import { PrivacyProtectionComponent } from './privacy-protection/privacy-protection.component';

@NgModule({
    imports: [
        CommonModule,
        LayoutModule,
        PersonalFinanceCommonModule
    ],
    declarations: [
        CreditResourcesComponent,
        IdentityProtectionComponent,
        PrivacyProtectionComponent
    ]
})
export class CreditResourcesModule {
}
