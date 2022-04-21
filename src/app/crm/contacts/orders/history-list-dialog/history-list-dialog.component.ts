/** Core imports */
import { OnInit, AfterViewInit, Inject, Component, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { OrderHistoryInfo, OrderServiceProxy } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './history-list-dialog.component.html',
    styleUrls: ['./history-list-dialog.component.less'],
    providers: [OrderServiceProxy]
})
export class HistoryListDialogComponent implements OnInit, AfterViewInit {
    private slider: any;
    ordersHistory$: Observable<OrderHistoryInfo[]>;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { orderId: number },
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private orderServiceProxy: OrderServiceProxy,
        public dialogRef: MatDialogRef<HistoryListDialogComponent>,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '75px',
            right: '-100vw'
        });
        this.loadingService.startLoading();
        this.ordersHistory$ = this.orderServiceProxy.getHistory(this.data.orderId).pipe(
            finalize(() => this.loadingService.finishLoading())
        );
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, 'calc(100vh - 75px)');
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
