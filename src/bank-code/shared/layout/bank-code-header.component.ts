/** Core imports */
import { Component, Directive, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Observable, zip } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from 'shared/AppConsts';
import { BankCodeLayoutService } from './bank-code-layout.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { MemberAreaLink } from '@shared/common/area-navigation/member-area-link.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppPermissions } from '@shared/AppPermissions';

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
    memberAreaLinks: MemberAreaLink[] = this.getMemberAreaLinks();

    constructor(
        private layoutService: BankCodeLayoutService,
        private router: Router,
        private lifecycleService: LifecycleSubjectsService,
        private ls: AppLocalizationService,
        private profileService: ProfileService,
        public sessionService: AppSessionService,
        public appSession: AppSessionService,
        private permission: AppPermissionService
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
        if (this.appSession.user) {
            zip(
                this.profileService.checkServiceSubscription(BankCodeServiceType.BANKTrainer),
                this.profileService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate),
                this.profileService.checkServiceSubscription(BankCodeServiceType.BANKCoach),
                this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass),
                this.profileService.checkServiceSubscription(BankCodeServiceType.Connect)
            ).subscribe(([showTrainerLink, showAffiliateLink, showCoachLink, hasBankPass, hasConnect]: [boolean, boolean, boolean, boolean, boolean]) => {
                this.memberAreaLinks = this.getMemberAreaLinks(showTrainerLink, showAffiliateLink, showCoachLink, hasBankPass, hasConnect, this.getBCRMLink());
            });
        }
    }

    private getMemberAreaLinks(showTrainerLink?: boolean, showAffiliateLink?: boolean, showCoachLink?: boolean, hasBankPass?: boolean, hasConnect?: boolean, bcrmLink?: string) {
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
                        routerUrl: 'products/codebreaker-ai',
                        hidden: !hasBankPass && hasConnect
                    },
                    {
                        namePrefix: this.ls.l('BankCode_Bank'),
                        name: this.ls.l('BankCode_Pass'),
                        routerUrl: 'products/bankpass'
                    },
                    {
                        namePrefix: this.ls.l('BankCode_Bank'),
                        name: this.ls.l('BankCode_Vault'),
                        routerUrl: 'products/bankvault'
                    },
                    {
                        name: this.ls.l('BankCode_CertifiedTrainer'),
                        routerUrl: 'products/bank-trainer',
                        hidden: !showTrainerLink
                    },
                    /*{
                        name: this.ls.l('BankCode_CertifiedCoach'),
                        routerUrl: 'products/bank-coach',
                        hidden: !showCoachLink
                    },*/
                    {
                        name: this.ls.l('BankCode_Affiliate'),
                        routerUrl: 'products/bank-affiliate',
                        hidden: !showAffiliateLink
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
                routerUrl: bcrmLink,
                hidden: !bcrmLink
            }
        ];
    }

    private getBCRMLink(): string {
        return this.permission.isGranted(AppPermissions.CRM) ? '../app/crm' : './products/bankpass';
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
