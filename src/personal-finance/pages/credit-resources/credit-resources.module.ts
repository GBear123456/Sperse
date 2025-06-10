import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonalFinanceCommonModule } from '../../shared/common/personal-finance-common.module';
import { LayoutModule } from '../../shared/layout/layout.module';

import { CreditResourcesComponent } from './credit-resources.component';
import { IdentityProtectionComponent } from './identity-protection/identity-protection.component';
import { PrivacyProtectionComponent } from './privacy-protection/privacy-protection.component';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        LayoutModule,
        PersonalFinanceCommonModule,
        RouterModule.forChild([{
            path: '',
            component: CreditResourcesComponent
        }])
    ],
    declarations: [
        CreditResourcesComponent,
        IdentityProtectionComponent,
        PrivacyProtectionComponent
    ]
})
export class CreditResourcesModule {
}
