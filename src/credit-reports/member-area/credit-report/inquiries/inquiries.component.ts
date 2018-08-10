import { Component, OnInit, Input, Injector, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { CreditReportDto, InquiryDto } from '@shared/service-proxies/service-proxies';
import { DxDataGridComponent } from 'devextreme-angular';

@Component({
    selector: 'app-inquiries',
    templateUrl: './inquiries.component.html',
    styleUrls: ['./inquiries.component.less']
})
export class InquiriesComponent extends AppComponentBase implements OnInit {
    @Input() creditReport: CreditReportDto;
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    inquiriesDataSource: InquiryData[] = [];

    constructor(
        injector: Injector
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CreditReportLocalizationSourceName;
    }

    ngOnInit() {
        this.creditReport.bureauReports.forEach(
            (bureauDto, index, array) => {
                if (bureauDto && bureauDto.inquiries) {
                    this.inquiriesDataSource = this.inquiriesDataSource.concat(bureauDto.inquiries.map((inquiry) => {
                        let data = new InquiryData(inquiry);
                        data.bureauName = bureauDto.bureau;
                        return data;
                    }));
                }
            }
        );
    }

showGroupping(event, show: boolean) {
    if (show) {
        this.dataGrid.instance.columnOption('bureauName', 'groupIndex', '0');
    }
    else {
        this.dataGrid.instance.clearGrouping();
    }

    event.currentTarget.parentElement[(show ? 'next' : 'previous') + 'ElementSibling']
        .children[0].classList.remove('active');
    event.currentTarget.classList.add('active');
}
}

class InquiryData extends InquiryDto {
    bureauName: string;
}
