/** Core imports */
import { OnInit, AfterViewInit, Injector, Inject, Component, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { OrderServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './history-list-dialog.component.html',
    styleUrls: ['./history-list-dialog.component.less'],
    providers: [OrderServiceProxy]
})
export class HistoryListDialogComponent extends AppComponentBase implements OnInit, AfterViewInit {
    private slider: any;
    ordersHistory = [];

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private elementRef: ElementRef,
        public dialogRef: MatDialogRef<HistoryListDialogComponent>,
        private orderServiceProxy: OrderServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        orderServiceProxy.getHistory(this.data.Id).subscribe((res) => {
            this.ordersHistory = res;
        });
    }

    ngOnInit() {
        this.dialogRef.disableClose = true;
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '75px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '75px',
                    right: '0px'
                });
            }, 100);
        });
    }

    close() {
        this.dialogRef.close();
    }
}