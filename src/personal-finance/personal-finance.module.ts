/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Application imports */
import { PersonalFinanceCommonModule } from './shared/common/personal-finance-common.module';
import { PersonalFinanceRoutingModule } from './personal-finance-routing.module';
import { PersonalFinanceComponent } from './personal-finance.component';
import { LayoutModule } from './shared/layout/layout.module';
import { PackageIdService } from './shared/common/packages/package-id.service';

@NgModule({
    declarations: [
        PersonalFinanceComponent
    ],
    imports: [
        LayoutModule,
        CommonModule,
        PersonalFinanceRoutingModule,
        PersonalFinanceCommonModule.forRoot()
    ],
    providers: [
        PackageIdService
    ]
})
export class PersonalFinanceModule { }
