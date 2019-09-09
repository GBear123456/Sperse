import { Component, AfterViewInit, Input, ViewChild } from '@angular/core';
import { CreditReportServiceProxy, AccountInfoDto, CreditReportDto } from '@shared/service-proxies/service-proxies';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import * as moment from 'moment';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent implements AfterViewInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @Input() creditReport: CreditReportDto;
    selectionChangedRaised: boolean;
    creditReportId: any;
    selectedRow: any;
    creditHistory: Object = {};
    creditHistoryStartDate: any;
    creditHistoryMonths: Array<Number> = Array(24).fill(0);
    creditHistoryYears: Array<Number> = [];
    accountInfo: AccountInfoDto[] = [];

    accountStatuses = [
        'Other', 'NotOpened', 'Unknown', 'Ok', 'L30', 'L60', 'L90', 'L120', 'L150', 'PP', 'RF', 'CC'
    ];

    constructor(
        private _accountInfoService: CreditReportServiceProxy,
        public ls: AppLocalizationService
    ) {
    }

    ngAfterViewInit() {
        this.dataGrid.instance.filter(['state', '=', 0]);
    }

    getRatioColor(ratio: number) {
        if (ratio > 50) return '#df533b';
        else if (ratio > 30) return '#ed9d1a';
        else if (ratio > 15) return '#f7d930';
        else return '#34be75';
    }

    getAccountInfoValue(item, node) {
        if (node == 'dateOpened' && item[node]) return item[node].format('MMM DD, YYYY');
        if (node == 'balance' && item[node] || node == 'moPayment' && item[node]) {
            return item[node].toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
            });
        }
        if (node == 'status') {
            if (item[node])
                return this.ls.l('closed');
            else return this.ls.l('open');
        }

        return item[node];
    }

    statusButtonUpdate(event, status) {
        this.dataGrid.instance.filter(['state', '=', status]);
        event.target.parentElement[(status ? 'previous' : 'next') + 'Sibling']
            .children[0].classList.remove('active');
        event.target.classList.add('active');
    }

    selectionChanged(e) {
        this.selectionChangedRaised = true;
        if (e.currentSelectedRowKeys.length) {
            e.component.collapseAll(-1);
            e.component.expandRow(e.currentSelectedRowKeys[0]);
            this.selectedRow = this.dataGrid.instance.getSelectedRowsData();
            this.getAccountInfo(this.creditReport.creditReportId, this.selectedRow[0].accountIds);
        }
    }

    collapseRows(e) {
        if (e.rowType == 'header') {
            e.component.collapseAll(-1);
            e.component.deselectAll();
        }
    }

    toggleMasterRow(e) {
        if (!this.selectionChangedRaised) {
            e.component.deselectAll();
            e.component.collapseAll(-1);
        }
        this.selectionChangedRaised = false;
    }

    prepareCreditHistory() {
        let maxHistoryDate = moment(new Date(0));
        this.accountInfo.forEach(account => {
            let history = this.creditHistory[account.bureau] = {};
            maxHistoryDate = moment.max(maxHistoryDate, account.maxAccountHistoryDate);
            account.twoYearHistory.forEach(data => {
                let historyIndex = String(data.year) + (data.month - 1);
                history[historyIndex] = {};
                history[historyIndex].status = this.accountStatuses[data.statusType];
                history[historyIndex].isPositive = data.isPositiveStatus;
                history[historyIndex].title = this.ls.l(this.accountStatuses[data.statusType]);
            });
        });

        let startDate = this.creditHistoryStartDate = moment(maxHistoryDate)
            .subtract(this.creditHistoryMonths.length - 1, 'months'), yearIterator;

        this.creditHistoryYears = [];
        this.creditHistoryMonths.map((value, index) => {
            let iterator = startDate.clone().add(index, 'months');
            if (iterator.year() != yearIterator)
                this.creditHistoryYears.push(yearIterator = iterator.year());
            this.creditHistoryMonths[index] = iterator.month();
        });
    }

    getCreditHistoryYearSpan(year) {
        return moment([year, 11, 29]).diff(moment.max(moment([year, 0, 1]),
            this.creditHistoryStartDate), 'months') + 1;
    }

    getAccountInfoUI(bureau: string, monthIndex: number, month: number) {
        if (!this.creditHistoryStartDate) return {};
        let historyIndex = String(this.creditHistoryStartDate.clone().add(monthIndex, 'months').year()) + month;
        let accInfo = this.creditHistory[bureau][historyIndex];
        return accInfo ? accInfo : { status: 'undefined' };
    }

    getAccountInfo(creditReportId, accountsIds): void {
        this._accountInfoService
            .getAccountInfo(creditReportId, accountsIds)
            .subscribe(result => {
                this.accountInfo = result;
                this.prepareCreditHistory();
            });
    }
}
