import { NgModule } from '@angular/core';
import { TermsOfServiceComponent } from '@root/personal-finance/pages/terms-of-service/terms-of-service.component';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [ TermsOfServiceComponent ],
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: TermsOfServiceComponent
            }
        ])
    ]
})
export class TermsOfServiceModule {}
