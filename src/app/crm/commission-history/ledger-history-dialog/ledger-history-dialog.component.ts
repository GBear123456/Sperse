/** Core imports */
import {
    ChangeDetectorRef, ChangeDetectionStrategy,
    Component, Inject, OnInit, ViewChild
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import * as moment from 'moment';
import { finalize, first, filter } from 'rxjs/operators';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import startCase from 'lodash/startCase';

/** Application imports */
import { CommissionServiceProxy, CommissionPayoutDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: 'ledger-history-dialog.component.html',
    styleUrls: [
        '../../../../shared/metronic/m-alert.less',
        '../../../../shared/metronic/m-helpers.less',
        'ledger-history-dialog.component.less'
    ],
    providers: [CurrencyPipe],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LedgerHistoryDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    ledgerHistory: CommissionPayoutDto[] = [];
    processedHistory: CommissionPayoutDto[] = [];
    historyProperties: string[];
    ignoreFields = ['id', 'transactionId', 'creationTime', 'creatorUserId', 'creatorUserName', 'creatorUserPhotoPublicId', 'processedTime'];
    startCase = startCase;
    Object = Object;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private changeDetectorRef: ChangeDetectorRef,
        private commissionProxy: CommissionServiceProxy,
        public profileService: ProfileService,
        private currencyPipe: CurrencyPipe,
        public ls: AppLocalizationService
    ) {
        this.historyProperties = Object.keys(CommissionPayoutDto.fromJS({})).filter(prop => !this.ignoreFields.some(x => x == prop));
    }

    ngOnInit() {
        this.modalDialog.startLoading();
        this.commissionProxy.getCommissionPayouts(this.data.ledgerEntryId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((res: CommissionPayoutDto[]) => {
                this.ledgerHistory = res;
                this.processHistory(res.slice().reverse());
                this.changeDetectorRef.detectChanges();

        });
    }

    processHistory(history: CommissionPayoutDto[]) {
        let processedHistory = [];
        for (let i = 0; i < history.length; i++) {
            let obj = {};

            for (let prop of this.historyProperties) {
                let propValue = history[i][prop];
                let propValueFormatted = this.formatPropValue(prop, propValue, history[i]);

                if (i == 0) {
                    if (propValue || propValue === 0) {
                        obj[prop] = propValueFormatted;
                    }
                } else {
                    let previuosRecordValue = history[i - 1][prop];
                    let isDate = moment.isMoment(propValue);
                    if ((!isDate && previuosRecordValue !== propValue) ||
                        (isDate && !propValue.isSame(previuosRecordValue))) {
                        obj[prop] = propValueFormatted;
                    }
                }
            }

            processedHistory.push(obj);
        }

        this.processedHistory = processedHistory.reverse();
    }

    formatPropValue(propName: string, value: any, object: CommissionPayoutDto): string {
        if (!value)
            return value;

        if (propName == 'fee' || propName == 'amount') {
            value = this.currencyPipe.transform(+value.toFixed(2));
        }

        if (propName == 'status')
            value = startCase(value);

        if (moment.isMoment(value)) {
            return moment(value).format(AppConsts.formatting.fieldDate);
        }

        return value;
    }

    getTimeAgo(historyPayout: CommissionPayoutDto, filed: string): string {
        return historyPayout[filed] && moment(historyPayout[filed]).fromNow();
    }

    getTimeHint(historyPayout: CommissionPayoutDto, filed: string): string {
        return historyPayout[filed] && moment(historyPayout[filed]).format('YYYY-MM-DD hh:mm:ss');
    }

    canShowProperty(object, index: number, isFirstColumn: boolean): boolean {
        let propsCount = Object.keys(object).length;
        let firstColumnCount = Math.ceil(propsCount / 2);
        return isFirstColumn ? index < firstColumnCount : index >= firstColumnCount;
    }
}