/** Core imports */
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { zip } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { MemberAreaLink } from '@shared/common/area-navigation/member-area-link.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    selector: 'products',
    templateUrl: 'products.component.html',
    styleUrls: ['./products.component.less']
})
export class ProductsComponent implements OnInit, OnDestroy {
    sidebarLinks: MemberAreaLink[] = this.getSidebarLinks();
    constructor(
        private profileService: ProfileService,
        private appSession: AppSessionService,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document
    ) {}

    ngOnInit() {
        this.document.body.classList.add('overflow-hidden');
        zip(
            this.profileService.checkServiceSubscription(BankCodeServiceType.CodebreakerAI),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKVault),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPassOnly),
            this.profileService.checkServiceSubscription(BankCodeServiceType.StarterKitPro).pipe(
                map((enabled: boolean) => enabled && this.profileService.isAscira)
            ),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKTrainer),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKCoach),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass),
            this.profileService.checkServiceSubscription(BankCodeServiceType.Connect)
        ).subscribe(([
            hasCodebreakerAI,
            hasBANKVault,
            hasBANKPassOnly,
            hasStarterKitPro,
            showBankTrainer, 
            showBankAffiliate, 
            showBankCoach, 
            hasBankPass, 
            hasConnect
        ]: boolean[]) => {
            this.sidebarLinks = this.getSidebarLinks(
                hasCodebreakerAI,
                hasBANKVault,
                hasBANKPassOnly,
                hasStarterKitPro,
                showBankTrainer, 
                showBankAffiliate, 
                showBankCoach, 
                hasBankPass, 
                hasConnect
            );
        });
    }

    private getSidebarLinks(
        hasCodebreakerAI?: boolean, 
        hasBANKVault?: boolean,
        hasBANKPassOnly?: boolean,
        hasStarterKitPro?: boolean,
        hasBankTrainer?: boolean, 
        hasBankAffiliate?: boolean, 
        hasBankCoach?: boolean, 
        hasBankPass?: boolean, 
        hasConnect?: boolean
    ) {
        return [
            {
                name: this.ls.l('BankCode_CodebreakerAI'),
                routerUrl: 'codebreaker-ai',
                hidden: !hasCodebreakerAI && this.appSession.tenant.isWhiteLabel && !(hasBANKVault || hasBankPass)
            },
            {
                namePrefix: this.ls.l('BankCode_Bank'),
                name: this.ls.l('BankCode_Pass'),
                hidden: !hasBANKVault && this.appSession.tenant.isWhiteLabel 
                    && !(hasBankPass || hasBANKPassOnly || hasConnect || hasStarterKitPro),
                routerUrl: 'bankpass'
            },
            {
                namePrefix: this.ls.l('BankCode_Bank'),
                name: this.ls.l('BankCode_Vault'),
                hidden: this.appSession.tenant.isWhiteLabel && !hasBANKVault,
                routerUrl: 'bankvault'
            },
            {
                name: this.ls.l('BankCode_CertifiedTrainer'),
                routerUrl: 'bank-trainer',
                hidden: !hasBankTrainer
            },
            /*{
                name: this.ls.l('BankCode_CertifiedCoach'),
                routerUrl: 'bank-coach',
                hidden: !showBankCoach
            },*/
            {
                name: this.ls.l('BankCode_Affiliate'),
                routerUrl: 'bank-affiliate',
                hidden: !hasBankAffiliate
            },
            {
                name: this.ls.l('BankCode_WhyTheyBuy'),
                routerUrl: 'why-they-buy'
            }
            /*
            {
                namePrefix: this.ls.l('BankCode_Bank'),
                name: this.ls.l('BankCode_Gear'),
                routerUrl: 'bank-gear'
            }*/
        ];
    }

    ngOnDestroy() {
        this.document.body.classList.remove('overflow-hidden');
    }
}