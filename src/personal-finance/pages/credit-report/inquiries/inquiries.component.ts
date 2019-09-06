import { Component, OnInit, Input,  ViewChild } from '@angular/core';
import { CreditReportDto, InquiryDto } from '@shared/service-proxies/service-proxies';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-inquiries',
    templateUrl: './inquiries.component.html',
    styleUrls: ['./inquiries.component.less']
})
export class InquiriesComponent implements OnInit {
    @Input() creditReport: CreditReportDto;
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    inquiriesDataSource: InquiryData[] = [];

    constructor(
        public ls: AppLocalizationService
    ) {
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
