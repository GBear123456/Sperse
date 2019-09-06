import { Component, Input } from '@angular/core';
import { CreditReportDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-public-info',
    templateUrl: './public-info.component.html',
    styleUrls: ['./public-info.component.less']
})
export class PublicInfoComponent {
    @Input() creditReport: CreditReportDto;

    dateFields = ['dateFiledOrReported', 'dateVerified', 'dateUpdated']

    constructor(
        public ls: AppLocalizationService
    ) {
    }

    getItemValue(item, node) {
        if (this.dateFields.indexOf(node) < 0)
            return item[node];
        else
            return item[node] ? item[node].format('MMM DD, YYYY') : '';
    }

    selectionChanged(e) {
        e.component.collapseAll(-1);
        e.component.expandRow(e.currentSelectedRowKeys[0]);
    }
}
