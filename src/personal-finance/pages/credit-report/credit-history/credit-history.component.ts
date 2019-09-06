import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CreditReportServiceProxy, CreditReportDto } from '@shared/service-proxies/service-proxies';
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import * as moment from 'moment';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-credit-history',
    templateUrl: './credit-history.component.html',
    styleUrls: ['./credit-history.component.less']
})
export class CreditHistoryComponent implements OnInit {
    @ViewChild(DxChartComponent) chart: DxChartComponent;
    @Input() creditReport: CreditReportDto;
    public scoreHistory: ScoreHistory[];
    bureauColors = {
        Equifax: '#b22642',
        Experian: '#177cc6',
        TransUnion: '#4fdadc'
    };

    constructor(
        private _creditReportService: CreditReportServiceProxy,
        public ls: AppLocalizationService
    ) {
    }

    ngOnInit() {
        this._creditReportService.getCreditReportHistory(2, this.creditReport.creditReportId)
            .subscribe(result => {
                if (result) {
                    this.scoreHistory = new Array<ScoreHistory>();
                    result.forEach((val) => {
                        val.value.forEach((scoreHisDto) => {
                            var his = new ScoreHistory();
                            his.bureau = val.key;
                            his.scoreDate = scoreHisDto.scoreDate.toDate();
                            his.score = scoreHisDto.score;
                            this.scoreHistory.push(his);
                        });
                    });
                }
            });
    }

    onLegendClick(e) {
        let series = e.target;
        if (series.isVisible()) {
            series.hide();
        } else {
            series.show();
        }
    }

    customizeDate = (arg: any) => {
        return this.formatDate(arg.value);
    }

    customizeSeries = (bureau: string) => {
        return this.bureauColors[bureau] ? { color: this.bureauColors[bureau] } : {};
    }

    customizeTooltip = (args: any) => {
        return {
            html: "<div><img src='assets/images/credit-report/" + args.seriesName.toLowerCase() + ".png' />" +
                "<div><b>" + this.ls.l('CR_CreditHistoryTooltip_Score') + "</b>: " + args.value + "</div>" +
                "<div><b>" + this.ls.l('CR_CreditHistoryTooltip_ScoreDate') + "</b>: " + this.formatDate(args.argument) + "</div></div>"
        };
    }

    formatDate(d): string {
        let m = moment(d);
        return m.format('MMM DD, YYYY');
    }
}

export class ScoreHistory {
    bureau: string;
    scoreDate: Date;
    score: number;
}
