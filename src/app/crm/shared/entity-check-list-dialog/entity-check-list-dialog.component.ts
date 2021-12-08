/** Core imports */
import { Component, OnInit, Inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from '@abp/notify/notify.service';
import { LeadServiceProxy, OrderServiceProxy, UpdateOrderStagePointInput,
    UpdateLeadStagePointInput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { EntityCheckListData } from '@app/crm/shared/entity-check-list-dialog/entity-check-list-data.interface';

@Component({
    selector: 'entity-check-list-dialog',
    templateUrl: './entity-check-list-dialog.component.html',
    styleUrls: ['./entity-check-list-dialog.component.less']
})
export class EntityCheckListDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    private slider: any;
    private isUpdated = false;
    dataSource: any[] = [];

    constructor(
        private elementRef: ElementRef,
        private leadProxy: LeadServiceProxy,
        private notifyService: NotifyService,
        private orderProxy: OrderServiceProxy,
        private loadingService: LoadingService,
        public dialogRef: MatDialogRef<EntityCheckListDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: EntityCheckListData,
        public ls: AppLocalizationService
    ) {
        this.loadData();
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
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

    loadData() {
        this.startLoading();
        (this.data.pipelinePurposeId == AppConsts.PipelinePurposeIds.order ?
            this.orderProxy.getStageChecklistPoints(this.data.entity.Id, undefined) :
            this.leadProxy.getStageChecklistPoints(this.data.entity.Id, undefined)
        ).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(res => {
            this.dataSource = res;
        });
    }

    startLoading() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
    }

    finishLoading() {
        this.loadingService.finishLoading(this.elementRef.nativeElement);
    }

    onValueChanged(event, cell) {
        this.startLoading();
        let data: any = {
            pointId: cell.data.id,
            leadId: this.data.entity.Id,
            orderId: this.data.entity.Id,
            isDone: event.value
        };
        (this.data.pipelinePurposeId == AppConsts.PipelinePurposeIds.order ?
            this.orderProxy.updateStagePoint(new UpdateOrderStagePointInput(data)) :
            this.leadProxy.updateLeadStagePoint(new UpdateLeadStagePointInput(data))
        ).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.isUpdated = true;
            this.loadData();
        });
    }

    close() {
        this.dialogRef.close(this.isUpdated);
    }
}