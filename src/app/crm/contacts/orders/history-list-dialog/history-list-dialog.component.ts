/** Core imports */
import { OnInit, AfterViewInit, Injector, Inject, Component, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { OrderHistoryInfo, OrderServiceProxy } from '@shared/service-proxies/service-proxies';
import { ObservableInput } from '@node_modules/rxjs';

@Component({
    templateUrl: './history-list-dialog.component.html',
    styleUrls: ['./history-list-dialog.component.less'],
    providers: [OrderServiceProxy]
})
export class HistoryListDialogComponent extends AppComponentBase implements OnInit, AfterViewInit {
    private slider: any;
    ordersHistory$: ObservableInput<OrderHistoryInfo[]>;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private elementRef: ElementRef,
        public dialogRef: MatDialogRef<HistoryListDialogComponent>,
        private orderServiceProxy: OrderServiceProxy
    ) {
        super(injector);
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
        this.startLoading();
        this.ordersHistory$ = this.orderServiceProxy.getHistory(this.data.Id).pipe(finalize(() => this.finishLoading()));
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
