/** Core imports */
import { Component, OnInit, Inject, AfterViewInit, ElementRef } from '@angular/core';

/** Third party imports */
import { Store } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { NotifyService } from '@abp/notify/notify.service';
import { CrmStore, PipelinesStoreActions } from '@app/crm/store';
import { StageChecklistServiceProxy, CreateStageChecklistPointInput, UpdateStageChecklistPointSortOrderInput,
    RenameStageChecklistPointInput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'check-list-dialog',
    templateUrl: './check-list-dialog.component.html',
    styleUrls: ['./check-list-dialog.component.less'],
    providers: [StageChecklistServiceProxy]
})
export class CheckListDialogComponent implements OnInit, AfterViewInit {
    private slider: any;
    dataSource: any[] = [];

    validationRules = [
        { type: 'required', message: this.ls.l('FieldIsRequired') },
    ];

    constructor(
        private elementRef: ElementRef,
        private notifyService: NotifyService,
        private checklistProxy: StageChecklistServiceProxy,
        private loadingService: LoadingService,
        private store$: Store<CrmStore.State>,
        public dialogRef: MatDialogRef<CheckListDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any,
        public ls: AppLocalizationService
    ) {
        this.dataSource = dialogData.stage.checklistPoints || [];
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

    addNewRecord() {
        if (this.dataSource.every(item => item.id))
            this.dataSource.push({sortOrder: 0, id: null, name: undefined});
    }

    onChanged(value, cell) {
        if (cell.data.id) {
            if (value) {
                this.startLoading();
                this.checklistProxy.renamePoint(new RenameStageChecklistPointInput({
                    id: cell.data.id,
                    name: value
                })).pipe(
                    finalize(() => this.finishLoading())
                ).subscribe(() => {
                    this.dataSource[cell.rowIndex].name = value;
                });
            } else
                this.notifyService.error(this.ls.l('NameIsRequired'));
        } else {
            if (value) {
                this.startLoading();
                this.dataSource[cell.rowIndex].name = value;
                this.checklistProxy.createPoint(new CreateStageChecklistPointInput({
                    stageId: this.dialogData.stage.id,
                    name: value
                })).pipe(
                    finalize(() => this.finishLoading())
                ).subscribe((res: any) => {
                    this.dataSource[cell.rowIndex].id = res.id;
                    this.dataSource[cell.rowIndex].sortOrder = res.sortOrder;
                });
            } else
                this.dataSource.splice(cell.rowIndex, 1);
        }
    }

    onDelete(value, cell) {
        this.startLoading();
        this.checklistProxy.deletePoint(cell.data.id).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.dataSource.splice(cell.rowIndex, 1);
        });
    }

    onReorder = (event) => {
        this.startLoading();
        this.dataSource[event.fromIndex].sortOrder = this.dataSource[event.toIndex].sortOrder;
        updatePointSortOrder(new UpdateStageChecklistPointSortOrderInput({
            id: this.dataSource[event.fromIndex].id,
            sortOrder: this.dataSource.length ? this.dataSource[event.toIndex].sortOrder : 0
        })).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
        });
    }

    close() {
        this.dialogRef.close();
    }
}