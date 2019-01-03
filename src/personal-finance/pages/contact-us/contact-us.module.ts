import { NgModule } from '@angular/core';
import { ContactUsComponent } from '@root/personal-finance/pages/contact-us/contact-us.component';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [ ContactUsComponent ],
    imports: [
        RouterModule.forChild([{
            path: '',
            component: ContactUsComponent
        }])
    ]
})
export class ContactUsModule {}
