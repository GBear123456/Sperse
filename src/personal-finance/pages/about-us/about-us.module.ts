import { NgModule } from '@angular/core';
import { AboutUsComponent } from '@root/personal-finance/pages/about-us/about-us.component';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [ AboutUsComponent ],
    imports: [
        RouterModule.forChild([{
            path: '',
            component: AboutUsComponent
        }])
    ]
})
export class AboutUsModule {}
