/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/** Application imports */
import { MemberAreaNavigationComponent } from './member-area-navigation/member-area-navigation.component';
import { PersonalFinanceHeaderComponent, AdHeaderHostDirective } from './personal-finance-header.component';
import { PersonalFinanceFooterComponent } from './personal-finance-footer.component';
import { PagesHeaderComponent } from './pages-header/pages-header.component';
import { PagesFooterComponent } from './pages-footer/pages-footer.component';
import { PersonalFinanceLayoutService } from './personal-finance-layout.service';
import { RegisterComponent } from '@root/shared/personal-finance-layout/register/register.component';
import { AreaNavigationModule } from '@shared/common/area-navigation/area-navigation.module';

let COMPONENTS = [
    PagesFooterComponent,
    PagesHeaderComponent,
    AdHeaderHostDirective,
    PersonalFinanceFooterComponent,
    PersonalFinanceHeaderComponent,
    MemberAreaNavigationComponent,
    RegisterComponent
];

@NgModule({
    imports: [
        AreaNavigationModule,
        CommonModule,
        RouterModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    providers: [
        PersonalFinanceLayoutService
    ]
})
export class PersonalFinanceLayoutModule { }
