import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreditReportsComponent } from './credit-reports.component';
import { CreditReportsRouteGuard } from './shared/common/auth/auth-route-guard';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { KbaResultComponent } from './member-area/kba-result/kba-result.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                canActivate: [CreditReportsRouteGuard],
                children: [
                    {
                        path: '',
                        loadChildren: 'credit-reports/landings/landing.module#LandingModule',
                        data: { preload: true }
                    },
                    {
                        path: 'member-area',
                        component: CreditReportsComponent,
                        canActivateChild: [CreditReportsRouteGuard],
                        children: [
                            {
                                path: '',
                                loadChildren: 'credit-reports/member-area/member-area.module#MemberAreaModule', //Lazy load module
                                data: { preload: true }
                            }
                        ]
                    },
                    {
                        path: 'member-area/kba-result',
                        component: KbaResultComponent
                    },
                    {
                        path: 'privacy-policy',
                        component: PrivacyPolicyComponent
                    },
                    {
                        path: 'terms-of-service',
                        component: TermsOfServiceComponent
                    },
                    {
                        path: 'about-us',
                        component: AboutUsComponent
                    },
                    {
                        path: 'contact-us',
                        component: ContactUsComponent
                    }
                ]
            }
        ])
    ],
    exports: [RouterModule]
})
export class CreditReportsRoutingModule { }
