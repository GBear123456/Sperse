/** Core imports */
import { Component, OnInit, Inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize, first, switchMap } from 'rxjs/operators';
import { zip, of } from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import { NotifyService } from 'abp-ng2-module';
import { CrmStore, PipelinesStoreActions, PipelinesStoreSelectors } from '@app/crm/store';
import { StageChecklistServiceProxy, CreateStageChecklistPointInput, UpdateStageChecklistPointSortOrderInput,
    RenameStageChecklistPointInput, StageChecklistPointDto, PipelineDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'check-list-dialog',
    templateUrl: './check-list-dialog.component.html',
    styleUrls: ['./check-list-dialog.component.less'],
    providers: [StageChecklistServiceProxy]
})
export class CheckListDialogComponent implements OnInit, AfterViewInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

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
        this.dataSource = cloneDeep(dialogData.stage.checklistPoints) || [];
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

    startLoading() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
    }

    finishLoading() {
        this.loadingService.finishLoading(this.elementRef.nativeElement);
    }

    addNewRecord() {
        if (this.dataSource.every(item => item.id))
            this.dataSource.push({sortOrder: Infinity, id: null, name: undefined});
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
                    this.reloadStageConfig();
                });
            } else
                this.notifyService.error(this.ls.l('NameIsRequired'));
        } else {
            if (value) {
                this.startLoading();
                cell.data.name = value;
                this.checklistProxy.createPoint(new CreateStageChecklistPointInput({
                    stageId: this.dialogData.stage.id,
                    name: value
                })).pipe(
                    finalize(() => this.finishLoading())
                ).subscribe((res: any) => {
                    cell.data.id = res.id;
                    cell.data.sortOrder = res.sortOrder;
                    this.reloadStageConfig();
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
            this.reloadStageConfig();
            this.dataSource.some((item, index) => {
                if (item.id == cell.data.id) {
                    this.dataSource.splice(index, 1);
                    return true;
                }
            });
        });
    }

    onReorder = (event) => {
        if (isNaN(event.fromIndex) || isNaN(event.toIndex)
            || event.fromIndex == event.toIndex || this.dataSource.length < 2
        ) return ;

        this.startLoading();
        let dataGridInstance = this.dataGrid.instance,
            records = dataGridInstance.getVisibleRows(),
            fromData = records[event.fromIndex].data,
            toData = records[event.toIndex].data,
            moveDown = event.fromIndex < event.toIndex,
            nextItem = records[event.toIndex + 1];
        fromData.sortOrder = toData.sortOrder;
        toData.sortOrder = toData.sortOrder + (0.000000001 * [1, -1][Number(moveDown)]);
        dataGridInstance.refresh();
        this.checklistProxy.updatePointSortOrder(new UpdateStageChecklistPointSortOrderInput({
            sortOrder: moveDown ? (nextItem ? nextItem.data.sortOrder : fromData.sortOrder + 1) : fromData.sortOrder,
            id: fromData.id
        })).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(() => {
            this.reloadStageConfig();
        });
    }

    reloadStageConfig() {
        zip(
            this.store$.pipe(select(PipelinesStoreSelectors.getPipelines()), first()),
            this.checklistProxy.getPoints(this.dialogData.stage.id)
        ).subscribe(([pipelines, checklist]: [PipelineDto[], StageChecklistPointDto[]]) => {
            pipelines.some(pipeline => {
                if (pipeline.purpose == this.dialogData.pipelinePurposeId) {
                    pipeline.stages.some(stage => {
                        if (this.dialogData.stage.id == stage.id) {
                            stage.checklistPoints = checklist;
                            return true;
                        }
                    });
                    return true;
                }
            });
            this.store$.dispatch(new PipelinesStoreActions.LoadSuccessAction(pipelines));
            this.dialogData.stage.checklistPoints = this.dataSource = checklist;
            this.dataGrid.instance.refresh();
        });
    }

    close() {
        this.dialogRef.close();
    }
}