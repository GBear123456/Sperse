import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PersonalFinanceCommonModule } from '../../shared/common/personal-finance-common.module';
import { LayoutModule } from '@root/personal-finance/shared/layout/layout.module';
import { HomeComponent, HomeHostDirective } from '@root/personal-finance/pages/home/home.component';
import { HostHomeComponent } from '@root/personal-finance/pages/home/layouts/host/host-home.component';
import { LendSpaceHomeComponent } from '@root/personal-finance/pages/home/layouts/lend-space/lend-space-home.component';

@NgModule({
    imports: [
        CommonModule,
        LayoutModule,
        PersonalFinanceCommonModule,
        RouterModule.forChild([{
            path: '',
            component: HomeComponent
        }])
    ],
    declarations: [
        HomeComponent,
        HostHomeComponent,
        LendSpaceHomeComponent,
        HomeHostDirective
    ],
    entryComponents: [
        HostHomeComponent,
        LendSpaceHomeComponent
    ]
})
export class HomeModule {}
