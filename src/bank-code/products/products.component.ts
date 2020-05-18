/** Core imports */
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { zip } from 'rxjs';

/** Application imports */
import { MemberAreaLink } from '@shared/common/area-navigation/member-area-link.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';

@Component({
    selector: 'products',
    templateUrl: 'products.component.html',
    styleUrls: ['./products.component.less']
})
export class ProductsComponent implements OnInit, OnDestroy {
    sidebarLinks: MemberAreaLink[] = this.getSidebarLinks();
    constructor(
        private profileService: ProfileService,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document
    ) {}

    ngOnInit() {
        this.document.body.classList.add('overflow-hidden');
        zip(
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKTrainer),
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKAffiliate)
        ).subscribe(([showBankTrainer, showBankAffiliate]: [boolean, boolean]) => {
            this.sidebarLinks = this.getSidebarLinks(showBankTrainer, showBankAffiliate);
        });
    }

    private getSidebarLinks(showBankTrainer?: boolean, showBankAffiliate?: boolean) {
        return [
            {
                name: this.ls.l('BankCode_CodebreakerAI'),
                routerUrl: 'codebreaker-ai'
            },
            {
                namePrefix: this.ls.l('BankCode_Bank'),
                name: this.ls.l('BankCode_Pass'),
                routerUrl: 'bankpass'
            },
            {
                namePrefix: this.ls.l('BankCode_Bank'),
                name: this.ls.l('BankCode_Vault'),
                routerUrl: 'bankvault'
            },
            {
                name: this.ls.l('BankCode_CertifiedTrainer'),
                routerUrl: 'bank-trainer',
                hidden: !showBankTrainer
            },
            {
                name: this.ls.l('BankCode_Affiliate'),
                routerUrl: 'bank-affiliate',
                hidden: !showBankAffiliate
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
