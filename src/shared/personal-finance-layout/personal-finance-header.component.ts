/** Core imports */
import { Component, HostBinding, ViewChild, ViewContainerRef, Directive, Injector } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppConsts } from 'shared/AppConsts';
import { PersonalFinanceLayoutService } from './personal-finance-layout.service';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { environment } from 'environments/environment';
import { AppFeatures } from '@shared/AppFeatures';
import { RegisterComponent } from '@root/shared/personal-finance-layout/register/register.component';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { LayoutType } from '../service-proxies/service-proxies';

@Directive({
    selector: '[ad-header-host]'
})
export class AdHeaderHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: 'personal-finance-header.component.html',
    styleUrls: ['personal-finance-header.component.less'],
    selector: 'personal-finance-header'
})
export class PersonalFinanceHeaderComponent {
    @ViewChild(AdHeaderHostDirective) adHeaderHost: AdHeaderHostDirective;
    @ViewChild(RegisterComponent) registerComponent: RegisterComponent;
    @HostBinding('class.pfm-app') hasPfmAppFeature = false;
    @HostBinding('class.yellow') yellowTheme =
        environment.LENDSPACE_HEADER_THEME == 'yellow';

    loggedUserId = abp.session.userId;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    showDefaultHeader = true;
    currentDate = new Date();
    appAreaLinks = this.getAppAreaLinks();
    memberAreaLinks = [
        {
            name: 'creditReportLink',
            imgUrl: 'assets/images/icons/credit-report-icon.svg',
            activeImgUrl: 'assets/images/icons/credit-report-active-icon.svg',
            routerUrl: '/personal-finance/credit-reports',
            sublinks: null
        },
        {
            name: 'creditResources',
            imgUrl: 'assets/images/icons/credit-resources-icon.svg',
            activeImgUrl: 'assets/images/icons/credit-resources-active-icon.svg',
            routerUrl: '/personal-finance/credit-resources'
        }
    ];
    actionsButtons = [
        { name: 'SIGN UP', class: 'member-signup', url: environment.LENDSPACE_DOMAIN + '/sign-up', disabled: false },
        { name: 'Member Login', class: 'member-login', url: environment.LENDSPACE_DOMAIN + '/login.html', disabled: false }
    ];
    applicationCompleteIsRequired$: Observable<Boolean>;

    constructor(
        injector: Injector,
        private pfmLayoutService: PersonalFinanceLayoutService,
        private abpSessionService: AbpSessionService,
        private featureService: FeatureCheckerService,
        private router: Router,
        private ls: AppLocalizationService,
        public appSession: AppSessionService
    ) {
        if (this.featureService.isEnabled(AppFeatures.PFMApplications)) {
            const offersService = injector.get(OffersService, null);
            if (offersService) {
                this.applicationCompleteIsRequired$ = offersService.applicationCompleteIsRequired$;
            }
        }

        pfmLayoutService.headerContentSubscribe((component) => {
            setTimeout(() => {
                this.adHeaderHost.viewContainerRef.clear();
                this.adHeaderHost.viewContainerRef.createComponent(component);
            });
        });
        if (this.featureService.isEnabled(AppFeatures.CFOPartner)) {
            this.memberAreaLinks.splice(1, 0,
                {
                    name: 'accountsLink',
                    imgUrl: 'assets/images/icons/credit-report-icon.svg',
                    activeImgUrl: 'assets/images/icons/credit-report-active-icon.svg',
                    routerUrl: '/personal-finance/my-finances',
                    sublinks: [
                        {
                            name: 'Accounts',
                            routerUrl: '/personal-finance/my-finances/accounts'
                        },
                        {
                            name: 'Overview',
                            routerUrl: '/personal-finance/my-finances/summary'
                        },
                        {
                            name: 'Budgeting',
                            routerUrl: '/personal-finance/my-finances/spending'
                        },
                        {
                            name: 'Transactions',
                            routerUrl: '/personal-finance/my-finances/transactions'
                        },
                        {
                            name: 'Holdings',
                            routerUrl: '/personal-finance/my-finances/holdings'
                        },
                        {
                            name: 'Allocation',
                            routerUrl: '/personal-finance/my-finances/allocation'
                        },
                        {
                            name: 'Goals',
                            routerUrl: '/personal-finance/my-finances/goals'
                        }
                    ]
                });
        }

        this.hasPfmAppFeature = this.featureService.isEnabled(AppFeatures.PFMApplications) && this.appSession.tenant.customLayoutType == LayoutType.LendSpace;
        this.showDefaultHeader = this.isMemberArea() || this.hasPfmAppFeature;
    }

    get notificationEnabled(): boolean {
        return (!this.abpSessionService.tenantId || this.featureService.isEnabled(AppFeatures.Notification));
    }

    private getAppAreaLinks() {
        let links = [
            {
                name: 'Loans',
                sublinks: [
                    {
                        name: this.ls.ls('PFM', 'Offers_PersonalLoans'),
                        routerUrl: '/personal-finance/offers/personal-loans'
                    },
                    {
                        name: this.ls.ls('PFM', 'Offers_BusinessLoans'),
                        routerUrl: '/personal-finance/offers/business-loans'
                    },
                    {
                        name: this.ls.ls('PFM', 'Offers_AutoLoans'),
                        routerUrl: '/personal-finance/offers/auto-loans'
                    }
                ]
            },
            {
                name: 'Credit Cards',
                routerUrl: '/personal-finance/offers/credit-cards/home'
            },
            {
                name: 'My Credit',
                sublinks: [
                    {
                        name: this.ls.ls('PFM', 'creditReportLink'),
                        routerUrl: '/personal-finance/credit-reports',
                        hidden: !this.featureService.isEnabled(AppFeatures.PFMCreditReport)
                    },
                    {
                        name: this.ls.ls('PFM', 'creditScores'),
                        routerUrl: '/personal-finance/offers/credit-scores'
                    },
                    // {
                    //     name: this.ls.ls('PFM', 'Offers_CreditRepair'),
                    //     routerUrl: '/personal-finance/offers/credit-repair'
                    // },
                    {
                        name: this.ls.ls('PFM', 'Offers_DebtConsolidation'),
                        routerUrl: '/personal-finance/offers/debt-consolidation'
                    },
                    {
                        name: this.ls.ls('PFM', 'Offers_IdTheftProtection'),
                        routerUrl: '/personal-finance/offers/id-theft-protection'
                    }
                ]
            },
            {
                name: 'My Finances',
                hidden: !this.featureService.isEnabled(AppFeatures.CFOPartner),
                sublinks: [
                    {
                        name: 'Accounts',
                        routerUrl: '/personal-finance/my-finances/accounts'
                    },
                    {
                        name: 'Overview',
                        routerUrl: '/personal-finance/my-finances/summary'
                    },
                    {
                        name: 'Budgeting',
                        routerUrl: '/personal-finance/my-finances/spending'
                    },
                    {
                        name: 'Transactions',
                        routerUrl: '/personal-finance/my-finances/transactions'
                    },
                    {
                        name: 'Holdings',
                        routerUrl: '/personal-finance/my-finances/holdings'
                    },
                    {
                        name: 'Allocation',
                        routerUrl: '/personal-finance/my-finances/allocation'
                    },
                    {
                        name: 'Goals',
                        routerUrl: '/personal-finance/my-finances/goals'
                    }
                ]
            },
            {
                name: 'Resources',
                url: this.loggedUserId ? null : environment.LENDSPACE_DOMAIN + '/resources',
                routerUrl: this.loggedUserId ? '/personal-finance/resources' : null
            }
        ];

        return links;
    }

    isMemberArea() {
        return Boolean(this.loggedUserId);
    }

    logoClick(event) {
        if (this.loggedUserId)
            this.router.navigate(['/personal-finance/home']);
        else
            window.open(environment.LENDSPACE_DOMAIN, '_self');
    }
}
