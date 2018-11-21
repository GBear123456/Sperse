import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PersonalFinanceComponent } from './personal-finance.component';
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
                component: PersonalFinanceComponent,
                canActivate: [ CreditReportsRouteGuard ],
                canActivateChild: [ CreditReportsRouteGuard ],
                children: [
                    {
                        path: '',
                        loadChildren: 'personal-finance/landings/landing.module#LandingModule',
                        data: { preload: true }
                    },
                    {
                        path: 'member-area',
                        children: [
                            {
                                path: '',
                                loadChildren: 'personal-finance/member-area/member-area.module#MemberAreaModule', //Lazy load module
                                data: { preload: true }
                            }
                        ]
                    },
                    {
                        path: 'member-area/kba-result',
                        component: KbaResultComponent,
                        data: {wrapperDisabled: true}
                    },
                    {
                        path: 'privacy-policy',
                        component: PrivacyPolicyComponent,
                        data: {wrapperDisabled: true}
                    },
                    {
                        path: 'terms-of-service',
                        component: TermsOfServiceComponent,
                        data: {wrapperDisabled: true}
                    },
                    {
                        path: 'about-us',
                        component: AboutUsComponent,
                        data: {wrapperDisabled: true}
                    },
                    {
                        path: 'contact-us',
                        component: ContactUsComponent,
                        data: {wrapperDisabled: true}
                    }
                ]
            }
        ])
    ],
    exports: [RouterModule]
})
export class PersonalFinanceRoutingModule { }
