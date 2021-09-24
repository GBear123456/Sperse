/** Core imports */
import { ChangeDetectorRef, ChangeDetectionStrategy,
    Component, Inject, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { PersonContactServiceProxy, PersonHistoryDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppConsts } from '../../../../../../shared/AppConsts';
import { isMoment } from 'moment';

@Component({
    templateUrl: 'person-history-dialog.component.html',
    styleUrls: [
        '../../../../../../shared/metronic/m-alert.less',
        '../../../../../../shared/metronic/m-helpers.less',
        'person-history-dialog.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonHistoryDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    personHistory: PersonHistoryDto[] = [];
    processedHistory: any[] = [];
    personHistoryProperties: string[];
    Object = Object;
    ignoreFields = ['creationTime', 'creatorUserId', 'creatorUserName', 'creatorUserPhotoPublicId', 'source'];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private changeDetectorRef: ChangeDetectorRef,
        private personProxy: PersonContactServiceProxy,
        public profileService: ProfileService,
        public ls: AppLocalizationService
    ) {
        this.personHistoryProperties = Object.keys(PersonHistoryDto.fromJS({})).filter(prop => !this.ignoreFields.some(x => x == prop));
    }

    ngOnInit() {
        this.modalDialog.startLoading();
        this.personProxy.getPersonHistory(this.data.contactId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result: PersonHistoryDto[]) => {
                this.personHistory = result;
                this.processHistory(result.slice().reverse())
                this.changeDetectorRef.detectChanges();
            });
    }

    processHistory(personHistory: PersonHistoryDto[]) {
        let processedHistory = [];
        for (let i = 0; i < personHistory.length; i++) {
            let obj = {};

            for (let prop of this.personHistoryProperties) {
                let propValue = personHistory[i][prop];
                let propValueFormatted = this.formatValue(propValue);

                if (i == 0) {
                    if (propValue || propValue === 0) {
                        obj[prop] = propValueFormatted;
                    }
                } else {
                    let previuosRecordValue = personHistory[i - 1][prop];
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

    formatValue(value: any): string {
        if (!value)
            return value;

        if (moment.isMoment(value)) {
            return moment(value).format(AppConsts.formatting.fieldDate);
        }
        return value;
    }

    getCreationTimeAgo(personHistory: PersonHistoryDto): string {
        return moment(personHistory.creationTime).fromNow();
    }

    getCreationTimeHint(personHistory: PersonHistoryDto): string {
        return moment(personHistory.creationTime).format('YYYY-MM-DD hh:mm:ss');
    }
}
