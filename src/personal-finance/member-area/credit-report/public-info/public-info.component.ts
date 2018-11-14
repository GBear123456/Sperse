import { Component, OnInit, Input, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { CreditReportDto } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'app-public-info',
  templateUrl: './public-info.component.html',
  styleUrls: ['./public-info.component.less']
})
export class PublicInfoComponent extends AppComponentBase implements OnInit {
    @Input() creditReport: CreditReportDto;

    dateFields = ['dateFiledOrReported', 'dateVerified', 'dateUpdated']

    constructor(
      injector: Injector
    ) {
      super(injector);
      this.localizationSourceName = AppConsts.localization.PFMLocalizationSourceName;
    }

    ngOnInit() {
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
