import { Component, OnInit, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'verification-checklist',
    templateUrl: './verification-checklist.component.html',
    styleUrls: ['./verification-checklist.component.less']
})
export class VerificationChecklistComponent extends AppComponentBase implements OnInit {
    checklist = [
        {
            name: this.l('Verification_Checklist_FullName'),
            status: 'success'
        },
        {
            name: this.l('Verification_Checklist_Email'),
            status: 'success'            
        },
        {
            name: this.l('Verification_Checklist_Phone'),
            status: 'success'            
        },
        {
            name: this.l('Verification_Checklist_Address'),
            status: 'unsuccess'            
        },
        {
            name: this.l('Verification_Checklist_Employment'),
            status: 'pending'            
        },
        {
            name: this.l('Verification_Checklist_Income'),
            status: 'unsuccess'            
        }
    ];
    personal_checklist_collapsed: boolean = false;

    constructor(injector: Injector) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
     }

    ngOnInit() {
    }

    getCheckStyle(status) {
        let style = '';
        switch (status) {
            case 'success':
                style = 'check';
                break;
            case 'unsuccess':
                style = 'times';
                break;
            case 'pending':
                style = 'square';
                break;
            default:
                style = 'square';
        }
        return style;
    }

    changeCollapseStatus() {
        this.personal_checklist_collapsed = !this.personal_checklist_collapsed;
    }
}
