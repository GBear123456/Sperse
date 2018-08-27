import { Component, OnInit, Input, Injector, ViewChild } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { CreditReportServiceProxy, ScoreHistoryDto, CreditReportDto } from '@shared/service-proxies/service-proxies';
import { DxChartComponent } from 'devextreme-angular';
import * as moment from 'moment'

@Component({
    selector: 'app-credit-history',
    templateUrl: './credit-history.component.html',
    styleUrls: ['./credit-history.component.less']
})
export class CreditHistoryComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxChartComponent) chart: DxChartComponent;
    @Input() creditReport: CreditReportDto;
    public scoreHistory: ScoreHistory[];
    bureauColors = {
        Equifax: '#b22642',
        Experian: '#177cc6',
        TransUnion: '#4fdadc'
    }

    constructor(
        injector: Injector,
        private _creditReportService: CreditReportServiceProxy
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CreditReportLocalizationSourceName;
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
                        })
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
    };

    customizeDate = (arg: any) => {
        return this.formatDate(arg.value);
    }

    customizeSeries = (bureau: string) => {
        return this.bureauColors[bureau] ? { color: this.bureauColors[bureau] } : {};
    }

    customizeTooltip = (args: any) => {
        return {
            html: "<div><img src='assets/images/credit-report/" + args.seriesName.toLowerCase() + ".png' />" +
            "<div><b>" + this.l('CR_CreditHistoryTooltip_Score') + "</b>: " + args.value + "</div>" +
            "<div><b>" + this.l('CR_CreditHistoryTooltip_ScoreDate') + "</b>: " + this.formatDate(args.argument) + "</div></div>"
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
