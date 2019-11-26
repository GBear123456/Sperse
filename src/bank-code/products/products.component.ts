import { Component, OnInit } from '@angular/core';
import { MemberAreaLink } from '@shared/common/area-navigation/member-area-link.enum';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'products',
    templateUrl: 'products.component.html',
    styleUrls: ['./products.component.less']
})
export class ProductsComponent implements OnInit {
    sidebarLinks: MemberAreaLink[] = [
        {
            name: this.ls.l('BankCode_CodebreakerAI'),
            routerUrl: 'codebreaker-ai'
        },
        {
            namePrefix: this.ls.l('BankCode_Bank'),
            name: this.ls.l('BankCode_Pass'),
            routerUrl: 'bank-pass'
        },
        {
            namePrefix: this.ls.l('BankCode_Bank'),
            name: this.ls.l('BankCode_Vault'),
            routerUrl: 'bank-vault'
        },
        {
            namePrefix: this.ls.l('BankCode_Bank'),
            name: this.ls.l('BankCode_Trainer'),
            routerUrl: 'bank-trainer'
        },
        {
            namePrefix: this.ls.l('BankCode_Bank'),
            name: this.ls.l('BankCode_Affiliate'),
            routerUrl: 'bank-affiliate'
        }
        /*{
            namePrefix: this.ls.l('BankCode_Bank'),
            name: this.ls.l('BankCode_Cards'),
            routerUrl: 'bank-cards'
        },
        {
            namePrefix: this.ls.l('BankCode_Bank'),
            name: this.ls.l('BankCode_Gear'),
            routerUrl: 'bank-gear'
        }*/
    ];
    constructor(public ls: AppLocalizationService) { }

    ngOnInit() { }
}
