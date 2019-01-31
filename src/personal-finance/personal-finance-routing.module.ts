import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PersonalFinanceComponent } from './personal-finance.component';
import { CreditReportsRouteGuard } from './shared/common/auth/auth-route-guard';
import { LoggedOutCreditReportGuard } from '@root/personal-finance/shared/common/auth/logged-out-credit-report-guard';
import { LoggedInCreditReportGuard } from '@root/personal-finance/shared/common/auth/logged-in-credit-report-guard';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: PersonalFinanceComponent,
                canActivate: [ CreditReportsRouteGuard],
                canActivateChild: [ CreditReportsRouteGuard ],
                children: [
                    {
                        path: 'start',
                        loadChildren: 'personal-finance/pages/lendspace-welcome/lendspace-welcome.module#LendspaceWelcomeModule',
                        data: {
                            wrapperDisabled: true
                        }
                    },
                    {
                        path: 'home',
                        loadChildren: 'personal-finance/pages/lendspace-welcome2/lendspace-welcome2.module#LendspaceWelcome2Module',
                        data: {
                            wrapperDisabled: true
                        }
                    },
                    {
                        path: 'signup',
                        loadChildren: 'personal-finance/landings/credit-report/wizard-form/wizard-page/wizard-page.module#WizardPageModule'
                    },
                    {
                        path: 'sign-up',
                        loadChildren: 'personal-finance/landings/lend-space-dark/signup/lend-space-signup.module#LendSpaceSignupModule',
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'kba-result',
                        loadChildren: 'personal-finance/pages/kba-result/kba-result.module#KbaResultModule',
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'privacy-policy',
                        loadChildren: 'personal-finance/pages/privacy-policy/privacy-policy.module#PrivacyPolicyModule',
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'terms-of-service',
                        loadChildren: 'personal-finance/pages/terms-of-service/terms-of-service.module#TermsOfServiceModule',
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'about',
                        loadChildren: 'personal-finance/pages/about-us/about-us.module#AboutUsModule',
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'contact-us',
                        loadChildren: 'personal-finance/pages/contact-us/contact-us.module#ContactUsModule',
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'resources',
                        loadChildren: 'personal-finance/pages/articles/articles.module#ArticlesModule',
                        data: { wrapperDisabled: true, isPublic: true }
                    },
                    {
                        path: 'offers',
                        loadChildren: 'personal-finance/shared/offers/offers.module#OffersModule',
                        data: { preload: false }
                    },
                    {
                        path: 'offers-b',
                        loadChildren: 'personal-finance/shared/offers-b/offers.module#OffersModuleB',
                        data: { preload: false }
                    },
                    {
                        path: 'credit-report',
                        canActivate: [ LoggedOutCreditReportGuard ],
                        loadChildren: 'personal-finance/pages/credit-report/credit-report.module#CreditReportModule'
                    },
                    {
                        path: 'credit-reports',
                        canActivate: [ LoggedInCreditReportGuard ],
                        loadChildren: 'personal-finance/pages/credit-report/credit-report.module#CreditReportModule'
                    },
                    {
                        path: 'credit-simulator',
                        loadChildren: 'personal-finance/pages/credit-simulator/credit-simulator.module#CreditSimulatorModule'
                    },
                    {
                        path: 'credit-resources',
                        loadChildren: 'personal-finance/pages/credit-resources/credit-resources.module#CreditResourcesModule'
                    },
                    {
                        path: 'my-finances',
                        loadChildren: 'personal-finance/pages/accounts/accounts.module#AccountsModule',
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: '',
                        component: PersonalFinanceComponent
                    }
                ]
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: [LoggedOutCreditReportGuard, LoggedInCreditReportGuard ]
})
export class PersonalFinanceRoutingModule { }
