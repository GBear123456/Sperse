/** Core imports */
import { Component, Directive, Injector, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
/** Third party imports */
import { forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
/** Application imports */
import { AppConsts } from 'shared/AppConsts';
import { BankCodeLayoutService } from './bank-code-layout.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { MemberAreaLink } from '@shared/common/area-navigation/member-area-link.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Directive({
    selector: '[ad-header-host]'
})
export class AdHeaderHostDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: 'bank-code-header.component.html',
    styleUrls: ['bank-code-header.component.less'],
    selector: 'bank-code-header',
    providers: [ LifecycleSubjectsService ]
})
export class BankCodeHeaderComponent implements OnInit, OnDestroy {
    @ViewChild(AdHeaderHostDirective) adHeaderHost: AdHeaderHostDirective;

    loggedUserId = abp.session.userId;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    currentDate = new Date();
    hideBCRMLink = true;
    memberAreaLinks: MemberAreaLink[] = this.getMemberAreaLinks();

    constructor(
        injector: Injector,
        private layoutService: BankCodeLayoutService,
        private router: Router,
        private lifecycleService: LifecycleSubjectsService,
        private ls: AppLocalizationService,
        private profileService: ProfileService,
        public sessionService: AppSessionService,
        public appSession: AppSessionService,
    ) {}

    ngOnInit() {
        this.layoutService.headerSubject$
            .pipe(takeUntil(this.lifecycleService.destroy$))
            .subscribe((component) => {
                setTimeout(() => {
                    this.adHeaderHost.viewContainerRef.clear();
                    this.adHeaderHost.viewContainerRef.createComponent(component);
                });
            });
        forkJoin(
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate)
        ).subscribe(([hasBankPassSubscription, hasBankAffiliateSubscription]: [ boolean, boolean ]) => {
            this.hideBCRMLink = !hasBankPassSubscription && !hasBankAffiliateSubscription;
            this.memberAreaLinks = this.getMemberAreaLinks();
        });
    }

    private getMemberAreaLinks() {
        return [
            {
                name: this.ls.l('Home'),
                routerUrl: 'home'
            },
            {
                name: this.ls.l('BankCode_Products'),
                routerUrl: 'products',
                sublinks: [
                    {
                        name: this.ls.l('BankCode_CodebreakerAI'),
                        routerUrl: 'products/codebreaker-ai'
                    },
                    {
                        name: this.ls.l('BankCode_BankPass'),
                        routerUrl: 'products/bank-pass'
                    },
                    {
                        name: this.ls.l('BankCode_BankVault'),
                        routerUrl: 'products/bank-vault'
                    },
                    {
                        name: this.ls.l('BankCode_BankTrainer'),
                        routerUrl: 'products/bank-trainer'
                    },
                    {
                        name: this.ls.l('BankCode_BankAffiliate'),
                        routerUrl: 'products/bank-affiliate'
                    },
                    {
                        name: this.ls.l('Why They Buy'),
                        routerUrl: 'products/why-they-buy'
                    }
                    /*{
                        name: this.ls.l('BankCode_BankCards'),
                        routerUrl: 'products/bank-cards'
                    },
                    {
                        name: this.ls.l('BankCode_BankGear'),
                        routerUrl: 'products/bank-gear'
                    }*/
                ]
            },
            {
                name: this.ls.l('BankCode_Resources'),
                routerUrl: 'resources'
            },
            {
                name: this.ls.l('BankCode_Events'),
                routerUrl: 'events'
            },
            {
                name: this.ls.l('BankCode_BCRM'),
                routerUrl: '../app/crm',
                hidden: this.hideBCRMLink
            }
        ];
    }

    logoClick() {
        if (this.loggedUserId)
            this.router.navigate(['/code-breaker']);
        else
            location.href = location.origin;
    }

    ngOnDestroy() {
        this.lifecycleService.destroy.next();
    }
}
