import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ActivatedRoute } from '@angular/router';
import { LeadServiceProxy, LeadInfoDto, CustomersServiceProxy, UpdateLeadInfoInput } from '@shared/service-proxies/service-proxies';

import * as moment from 'moment';

@Component({
    selector: 'lead-information',
    templateUrl: './lead-information.component.html',
    styleUrls: ['./lead-information.component.less']
})
export class LeadInformationComponent extends AppComponentBase implements OnInit {
    data: {
        leadInfo: LeadInfoDto
    };

    private paramsSubscribe: any = [];
    private formatting = AppConsts.formatting;
    
    isEditAllowed = false;

    stages: any[];
    types: any[];
    sources: any[];

    layoutColumns: any[] = [
        {
            sections: [
                {
                    name: "General",
                    items: [ 
                        { name: 'stage', readonly: true }, 
                        { name: 'amount', readonly: true }, 
                        { name: 'creationDate', readonly: true }, 
                        { name: 'modificationDate', readonly: true } 
                    ]
                },
                {
                    name: "LeadSource",
                    items: [ { name: 'sourceCode' } ]
                }
            ]
        },
        {
            sections: [
                {
                    name: "Campaign",
                    items: [ { name: 'campaignCode' }, { name: 'affiliateCode' }, { name: 'channelCode' } ]
                },
                {
                    name: "Comments",
                    items: [ { name: 'comments', hideLabel: true} ]
                }
            ]
        }
    ];

    constructor(injector: Injector,
                private _route: ActivatedRoute,
                private _customerService: CustomersServiceProxy,
                private _leadService: LeadServiceProxy) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.isEditAllowed = this.isGranted('Pages.CRM.Leads.ManageLeads');
    }
        
    ngOnInit() {
        this.data = this._customerService['data'];
    }

    getPropData(item) {
        if (item.data)
            return item.data;

        let field = item.name;
        let result = {
            id: (this.data && this.data.leadInfo) ? this.data.leadInfo.id : null,
            value: this.getPropValue(field),
            isEditDialogEnabled: false,
            lEntityName: field,
            lEditPlaceholder: this.l('EditValuePlaceholder')
        };
        return result;
    }

    getPropValue(field){
        let leadInfo = this.data && this.data.leadInfo;
        let value = leadInfo && leadInfo[field];
        if (!value)
            return null;

        return value instanceof moment ? value.format(this.formatting.date) : value;
    }
    
    updateValue(value, item) {
        let fieldName = item.name;
        this.data.leadInfo[fieldName] = value;
        this._leadService.updateLeadInfo(
            UpdateLeadInfoInput.fromJS(this.data.leadInfo)
        ).subscribe(result => {});
    }
}
