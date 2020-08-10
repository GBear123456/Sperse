/** Core imports */
import { Component, OnInit, Inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize, first } from 'rxjs/operators';

/** Application imports */
import { NotifyService } from '@abp/notify/notify.service';
import { CrmStore, PipelinesStoreActions, PipelinesStoreSelectors } from '@app/crm/store';
import { StageChecklistServiceProxy, LeadServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'entity-check-list-dialog',
    templateUrl: './entity-check-list-dialog.component.html',
    styleUrls: ['./entity-check-list-dialog.component.less'],
    providers: [StageChecklistServiceProxy]
})
export class EntityCheckListDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

    private slider: any;
    dataSource: any[] = [];

    validationRules = [
        { type: 'required', message: this.ls.l('FieldIsRequired') },
    ];

    constructor(
        private elementRef: ElementRef,
        private leadProxy: LeadServiceProxy,
        private notifyService: NotifyService,
        private checklistProxy: StageChecklistServiceProxy,
        private loadingService: LoadingService,
        private store$: Store<CrmStore.State>,
        public dialogRef: MatDialogRef<EntityCheckListDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public ls: AppLocalizationService
    ) {
        leadProxy.getStageChecklistPoints(data.entity.Id).subscribe(res => {
            console.log(this.dataSource = res);
        });
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '210px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.slider.classList.remove('hide');
            this.dialogRef.updateSize(undefined, '100vh');
            setTimeout(() => {
                this.dialogRef.updatePosition({
                    top: '210px',
                    right: '0px'
                });
            }, 100);
        });
    }

    startLoading() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
    }

    finishLoading() {
        this.loadingService.finishLoading(this.elementRef.nativeElement);
    }

    onValueChanged(event, cell) {
        console.log(event, cell);
    }

    close() {
        this.dialogRef.close();
    }
}