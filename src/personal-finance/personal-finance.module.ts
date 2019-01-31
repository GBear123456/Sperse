/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';

/** Application imports */
import { PersonalFinanceCommonModule } from './shared/common/personal-finance-common.module';
import { PersonalFinanceRoutingModule } from './personal-finance-routing.module';
import { PersonalFinanceComponent } from './personal-finance.component';
import { PackageIdService } from './shared/common/packages/package-id.service';
import { PersonalFinanceLayoutModule } from '@shared/personal-finance-layout/personal-finance-layout.module';
import { InstanceServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    declarations: [
        PersonalFinanceComponent,
        //ApplyOfferDialogComponent
    ],
    imports: [
        PersonalFinanceLayoutModule,
        CommonModule,
        MatDialogModule,
        PersonalFinanceRoutingModule,
        PersonalFinanceCommonModule.forRoot()
    ],
    providers: [
        PackageIdService,
        InstanceServiceProxy
    ]
})
export class PersonalFinanceModule {}
