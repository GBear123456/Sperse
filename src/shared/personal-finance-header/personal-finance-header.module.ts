/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Application imports */
import { MemberAreaNavigationComponent } from './member-area-navigation/member-area-navigation.component';
import { AppAreaNavigationComponent } from './app-area-navigation/app-area-navigation.component';
import { PersonalFinanceHeaderComponent } from './personal-finance-header.component';
import { AppService } from '@app/app.service';
import { PagesHeaderComponent } from './pages-header/pages-header.component';
import { LayoutCommonModule } from '@app/shared/layout/layout-common.module';
import { CFOService } from '@shared/cfo/cfo.service';
import { UserOnlyCFOService } from '@root/personal-finance/shared/common/user-only.cfo.service';
import { InstanceServiceProxy } from '@shared/service-proxies/service-proxies';

let COMPONENTS = [
    PagesHeaderComponent,
    PersonalFinanceHeaderComponent,
    AppAreaNavigationComponent,
    MemberAreaNavigationComponent
];

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        RouterModule,

        LayoutCommonModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    providers: [
        AppService,
        InstanceServiceProxy,
        {
            provide: CFOService,
            useClass: UserOnlyCFOService
        }
    ]
})
export class PersonalFinanceHeaderModule { }
