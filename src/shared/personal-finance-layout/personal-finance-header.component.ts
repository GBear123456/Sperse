/** Core imports */
import { Component, Injector, HostBinding, ViewChild, ViewContainerRef,
    Type, Directive, ComponentFactoryResolver } from '@angular/core';

/** Application imports */
import { AppConsts } from 'shared/AppConsts';
import { AppComponentBase } from 'shared/common/app-component-base';
import { PersonalFinanceLayoutService } from './personal-finance-layout.service';
import { environment } from 'environments/environment';

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
export class PersonalFinanceHeaderComponent extends AppComponentBase {
    @ViewChild(AdHeaderHostDirective) adHeaderHost: AdHeaderHostDirective;
    @HostBinding('class.pfm-app') hasPfmAppFeature = false;

    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    showDefaultHeader = true;
    loggedUserId: number;

    currentDate = new Date();
    appAreaLinks = this.getAppAreaLinks();

    memberAreaLinks = [
        {
            name: 'creditReportLink',
            imgUrl: 'assets/images/icons/credit-report-icon.svg',
            activeImgUrl: 'assets/images/icons/credit-report-active-icon.svg',
            routerUrl: '/personal-finance'
        },
        {
            name: 'creditSimulatorLink',
            imgUrl: 'assets/images/icons/credit-simulator-icon.svg',
            activeImgUrl: 'assets/images/icons/credit-simulator-active-icon.svg',
            routerUrl: '/personal-finance/credit-simulator'
        },
        {
            name: 'creditResources',
            imgUrl: 'assets/images/icons/credit-resources-icon.svg',
            activeImgUrl: 'assets/images/icons/credit-resources-active-icon.svg',
            routerUrl: '/personal-finance/credit-resources'
        }
    ];
    actionsButtons = [
        {name: 'SIGN UP', class: 'member-signup', url: environment.LENDSPACE_DOMAIN + '/sign-up', disabled: false},
        {name: 'Member Login', class: 'member-login', url: environment.LENDSPACE_DOMAIN + '/login.html', disabled: false}
    ];

    constructor(
        injector: Injector,
        private _pfmLayoutService: PersonalFinanceLayoutService
    ) {
        super(injector, AppConsts.localization.PFMLocalizationSourceName);
        _pfmLayoutService.headerContentSubscribe((component) => {
            setTimeout(() => {
                this.adHeaderHost.viewContainerRef.clear();
                this.adHeaderHost.viewContainerRef.createComponent(component);
            });
        });
        if (this.feature.isEnabled('CFO.Partner')) {
            this.memberAreaLinks.unshift(
                {
                    name: 'accountsLink',
                    imgUrl: 'assets/images/icons/credit-report-icon.svg',
                    activeImgUrl: 'assets/images/icons/credit-report-active-icon.svg',
                    routerUrl: '/personal-finance/my-finances'
                });
        }

        this.loggedUserId = abp.session.userId;
        this.hasPfmAppFeature = this.feature.isEnabled('PFM.Applications');
        this.showDefaultHeader = this.isMemberArea() || this.hasPfmAppFeature;
    }

    private getAppAreaLinks() {
        return [
            {
                name: 'Loans',
                sublinks: [
                    {
                        name: this.ls('PFM', 'Offers_PersonalLoans'),
                        routerUrl: '/personal-finance/offers/personal-loans'
                    },
                    {
                        name: this.ls('PFM', 'Offers_PaydayLoans'),
                        routerUrl: '/personal-finance/offers/payday-loans'
                    },
                    {
                        name: this.ls('PFM', 'Offers_InstallmentLoans'),
                        routerUrl: '/personal-finance/offers/installment-loans'
                    },
                    {
                        name: this.ls('PFM', 'Offers_BusinessLoans'),
                        routerUrl: '/personal-finance/offers/business-loans'
                    },
                    {
                        name: this.ls('PFM', 'Offers_AutoLoans'),
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
                        name: this.ls('PFM', 'creditScores'),
                        routerUrl: '/personal-finance/offers/credit-scores'
                    },
                    // {
                    //     name: this.ls('PFM', 'Offers_CreditRepair'),
                    //     routerUrl: '/personal-finance/offers/credit-repair'
                    // },
                    {
                        name: this.ls('PFM', 'Offers_DebtConsolidation'),
                        routerUrl: '/personal-finance/offers/debt-consolidation'
                    },
                    {
                        name: this.ls('PFM', 'Offers_IdTheftProtection'),
                        routerUrl: '/personal-finance/offers/id-theft-protection'
                    }
                ]
            },
            {
                name: 'My Finances',
                hidden: !this.feature.isEnabled('CFO.Partner'),
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
                url: environment.LENDSPACE_DOMAIN + '/resources'
            }
        ];
    }

    isMemberArea() {
        return Boolean(this.loggedUserId);
    }

    logoClick(event) {
        if (this.loggedUserId)
            this._router.navigate(['/personal-finance/home']);
        else
            window.open(environment.LENDSPACE_DOMAIN, '_self');
    }
}
