import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PersonalFinanceComponent } from './personal-finance.component';
import { CreditReportsRouteGuard } from './shared/common/auth/auth-route-guard';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { KbaResultComponent } from './member-area/kba-result/kba-result.component';
import { LendSpaceComponent } from '@root/personal-finance/landings/lend-space/lend-space.component';
import { LendSpaceDarkComponent } from '@root/personal-finance/landings/lend-space-dark/lend-space-dark.component';
import { CreditWizardPageComponent } from '@root/personal-finance/landings/credit-report/wizard-form/wizard-page/wizard-page.component';
import { CreditReportComponent } from '@root/personal-finance/landings/credit-report/credit-report.component';
import { LoggedOutCreditReportGuard } from '@root/personal-finance/shared/common/auth/logged-out-credit-report-guard';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: PersonalFinanceComponent,
                canActivate: [ CreditReportsRouteGuard ],
                canActivateChild: [ CreditReportsRouteGuard ],
                children: [
                    {
                        path: '',
                        component: LendSpaceDarkComponent,
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'signup',
                        component: CreditWizardPageComponent
                    },
                    {
                        path: 'lend-space',
                        component: LendSpaceComponent
                    },
                    {
                        path: 'kba-result',
                        component: KbaResultComponent,
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'privacy-policy',
                        component: PrivacyPolicyComponent,
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'terms-of-service',
                        component: TermsOfServiceComponent,
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'about-us',
                        component: AboutUsComponent,
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'contact-us',
                        component: ContactUsComponent,
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'offers',
                        loadChildren: 'personal-finance/shared/offers/offers.module#OffersModule',
                        data: { preload: true }
                    },
                    {
                        path: 'credit-reports',
                        canActivate: [ LoggedOutCreditReportGuard ],
                        component: CreditReportComponent
                    },
                    {
                        path: '',
                        loadChildren: 'personal-finance/member-area/member-area.module#MemberAreaModule', //Lazy load module
                        data: { preload: true }
                    }
                ]
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: [ LoggedOutCreditReportGuard ]
})
export class PersonalFinanceRoutingModule { }
