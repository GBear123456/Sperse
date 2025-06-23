import { NgModule } from '@angular/core';
import { RouteConfigLoadEnd, Router, RouterModule } from '@angular/router';
import { PersonalFinanceComponent } from './personal-finance.component';
import { CreditReportsRouteGuard } from './shared/common/auth/auth-route-guard';
import { LoggedOutCreditReportGuard } from '@root/personal-finance/shared/common/auth/logged-out-credit-report-guard';
import { LoggedInCreditReportGuard } from '@root/personal-finance/shared/common/auth/logged-in-credit-report-guard';
import { LoadingService } from '@shared/common/loading-service/loading.service';

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
                        path: 'start',
                        loadChildren: () => import('personal-finance/pages/lendspace-welcome/lendspace-welcome.module').then(m => m.LendspaceWelcomeModule),
                        data: {
                            wrapperDisabled: true
                        }
                    },
                    {
                        path: 'home',
                        loadChildren: () => import('personal-finance/pages/home/home.module').then(m => m.HomeModule),
                        data: {
                            wrapperDisabled: true
                        }
                    },
                    {
                        path: 'signup',
                        loadChildren: () => import('personal-finance/landings/credit-report/wizard-form/wizard-page/wizard-page.module').then(m => m.WizardPageModule)
                    },
                    {
                        path: 'sign-up',
                        loadChildren: () => import('personal-finance/landings/lend-space-dark/signup/lend-space-signup.module').then(m => m.LendSpaceSignupModule),
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'kba-result',
                        loadChildren: () => import('personal-finance/pages/kba-result/kba-result.module').then(m => m.KbaResultModule),
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'privacy-policy',
                        loadChildren: () => import('personal-finance/pages/privacy-policy/privacy-policy.module').then(m => m.PrivacyPolicyModule),
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'terms-of-service',
                        loadChildren: () => import('personal-finance/pages/terms-of-service/terms-of-service.module').then(m => m.TermsOfServiceModule),
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'about',
                        loadChildren: () => import('personal-finance/pages/about-us/about-us.module').then(m => m.AboutUsModule),
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'contact-us',
                        loadChildren: () => import('personal-finance/pages/contact-us/contact-us.module').then(m => m.ContactUsModule),
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'resources',
                        loadChildren: () => import('personal-finance/pages/articles/articles.module').then(m => m.ArticlesModule),
                        data: { wrapperDisabled: true, isPublic: true }
                    },
                    {
                        path: 'offers',
                        loadChildren: () => import('personal-finance/shared/offers/offers.module').then(m => m.OffersModule),
                        data: { preload: false }
                    },
                    {
                        path: 'credit-report',
                        canActivate: [ LoggedOutCreditReportGuard ],
                        loadChildren: () => import('personal-finance/pages/credit-report/credit-report.module').then(m => m.CreditReportModule)
                    },
                    {
                        path: 'credit-reports',
                        canActivate: [ LoggedInCreditReportGuard ],
                        loadChildren: () => import('personal-finance/pages/credit-report/credit-report.module').then(m => m.CreditReportModule)
                    },
                    {
                        path: 'credit-simulator',
                        loadChildren: () => import('personal-finance/pages/credit-simulator/credit-simulator.module').then(m => m.CreditSimulatorModule)
                    },
                    {
                        path: 'credit-resources',
                        loadChildren: () => import('personal-finance/pages/credit-resources/credit-resources.module').then(m => m.CreditResourcesModule)
                    },
                    {
                        path: 'my-finances',
                        loadChildren: () => import('personal-finance/pages/accounts/accounts.module').then(m => m.AccountsModule),
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
    providers: [ LoggedOutCreditReportGuard, LoggedInCreditReportGuard ]
})
export class PersonalFinanceRoutingModule { }
