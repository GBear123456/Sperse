/** Core imports */
import {
    Component, Input, Inject, OnInit
} from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, tap, delay, switchMap } from 'rxjs/operators';
import { NotifyService } from 'abp-ng2-module';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';

@Component({
    selector: 'bulk-progress-dialog',
    templateUrl: './bulk-progress-dialog.component.html',
    styleUrls: ['./bulk-progress-dialog.component.less']
})
export class BulkProgressDialogComponent implements OnInit {
    totalCount: number;
    failedCount: number = 0;
    completedCount: number = 0;

    constructor(
        public dialogRef: MatDialogRef<BulkProgressDialogComponent>,
        private appHttpConfiguration: AppHttpConfiguration,
        public ls: AppLocalizationService,
        private notify: NotifyService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}

    ngOnInit() {
        this.totalCount = this.data.length;

        if (this.totalCount) {
            this.appHttpConfiguration.avoidErrorHandling = true;
            forkJoin(this.data.map((request, i) => of(null).pipe(delay(i * 500), 
                switchMap(() => request.pipe(
                    catchError(e => of(e)),
                    tap(res => {
                        if (res)
                            this.failedCount++;
                        else
                            this.completedCount++;                        
                    })
                ))
            ))).pipe(
                finalize(() => this.appHttpConfiguration.avoidErrorHandling = false),
            ).subscribe(res => {
                if (this.failedCount)
                    this.notify.warn(this.ls.l('BulkActionFailed', this.failedCount, this.totalCount))
                else
                    this.notify.info(this.ls.l('AppliedSuccessfully'));
            });
        }
    }
}