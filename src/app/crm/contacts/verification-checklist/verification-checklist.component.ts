import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { VerificationChecklistItem, VerificationChecklistItemStatus } from './verification-checklist.model';

@Component({
    selector: 'verification-checklist',
    templateUrl: './verification-checklist.component.html',
    styleUrls: ['./verification-checklist.component.less']
})
export class VerificationChecklistComponent extends AppComponentBase implements OnInit {
    @Input() data: VerificationChecklistItem[];
    collapsed: boolean = false;

    constructor(injector: Injector) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
    }

    getItemName(item: VerificationChecklistItem):string {
        return this.l(`Verification_Checklist_${this.capitalize(item.type)}`);
    }

    getItemCounts(item: VerificationChecklistItem): string {
        return (item.confirmedCount != null 
            ? `(${item.confirmedCount}/${item.totalCount})` 
            : (item.totalCount == null ? '' : `(${item.totalCount })`)
        );
    }

    getCheckStyle(status) {
        let style = '';
        switch (status) {
            case VerificationChecklistItemStatus.success:
                style = 'check';
                break;
            case VerificationChecklistItemStatus.unsuccess:
                style = 'times';
                break;
            case VerificationChecklistItemStatus.pending:
                style = 'square';
                break;
            default:
                style = 'square';
        }
        return style;
    }

    changeCollapseStatus() {
        this.collapsed = !this.collapsed;
    }
}
