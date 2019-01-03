import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PrivacyPolicyComponent } from '@root/personal-finance/pages/privacy-policy/privacy-policy.component';

@NgModule({
    declarations: [ PrivacyPolicyComponent ],
    imports: [
        RouterModule.forChild([{
            path: '',
            component: PrivacyPolicyComponent
        }])
    ]
})
export class PrivacyPolicyModule {}
