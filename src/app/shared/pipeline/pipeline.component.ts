/** Core imports */
import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, EventEmitter,
    Output, Input, OnInit, OnDestroy, ViewChildren, QueryList
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import DataSource from 'devextreme/data/data_source';
import dxTooltip from 'devextreme/ui/tooltip';
import { Observable, Subject, from, of, forkJoin } from 'rxjs';
import { filter, finalize, delayWhen, map, mergeMap, switchMap, takeUntil } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';
import * as moment from 'moment';
import extend from 'lodash/extend';
import clone from 'lodash/clone';
import uniqBy from 'lodash/uniqBy';
import oDataUtils from "devextreme/data/odata/utils";

/** Application imports */
import { ODataService } from '@shared/common/odata/odata.service';
import { CrmStore, PipelinesStoreActions } from '@app/crm/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    PipelineDto,
    StageDto,
    StageServiceProxy,
    CreateStageInput,
    RenameStageInput,
    MergeStagesInput,
    UpdateSortOrderInput
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { PipelineService } from './pipeline.service';
import { AddRenameMergeDialogComponent } from './add-rename-merge-dialog/add-rename-merge-dialog.component';
import { ContactGroup } from '@shared/AppEnums';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { FiltersService } from '@shared/filters/filters.service';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DxoTooltipComponent } from '@root/node_modules/devextreme-angular/ui/nested/tooltip';
import { Stage } from '@app/shared/pipeline/stage.model';

@Component({
    selector: 'app-pipeline',
    templateUrl: './pipeline.component.html',
    styleUrls: ['./pipeline.component.less'],
    providers: [ StageServiceProxy ],
    host: {
        '(window:keyup)': 'onKeyUp($event)',
        '(window:resize)': 'onResize()'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChildren('bankCodeTooltip') bankCodeTooltips: QueryList<DxoTooltipComponent>;
    @Output() onStagesLoaded: EventEmitter<any> = new EventEmitter<any>();
    @Output() onCardClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onEntityStageChanged: EventEmitter<any> = new EventEmitter<any>();

    private _selectedEntities: any;
    private _dataSource: any;
    private _totalDataSource: any;
    private _dataSources: any = {};
    private refreshTimeout: any;
    private shiftStartEntity: any;
    private stageId: number;
    private dataSource$: Subject<DataSource> = new Subject<DataSource>();

    createStageInput: CreateStageInput = new CreateStageInput();
    renameStageInput: RenameStageInput = new RenameStageInput();
    mergeStagesInput: MergeStagesInput = new MergeStagesInput();
    currentTooltip: dxTooltip;

    @Output() selectedEntitiesChange = new EventEmitter<any>();
    @Input() get selectedEntities() {
        return this._selectedEntities || [];
    }
    set selectedEntities(entities) {
        this._selectedEntities = entities;
        this.selectedEntitiesChange.emit(this._selectedEntities);
    }

    @Input() moveDisabled = false;
    @Input() dragulaName = 'stage';
    @Input() totalsURI: string;
    @Input() selectFields: string[];
    @Input() filterModelStages: any;
    @Input('dataSource')
    set dataSource(dataSource: DataSource) {
        if (this._dataSource = dataSource)
            this.dataSource$.next(dataSource);
    }
    @Input() pipelinePurposeId: string;
    @Input() get contactGroupId(): ContactGroup {
        return this._contactGroupId;
    }
    set contactGroupId(value: ContactGroup) {
        if (this._contactGroupId) {
            this.destroyPipeline();
            setTimeout(this.initPipeline.bind(this), 100);
        }

        this._contactGroupId = value;
    }

    pipeline: PipelineDto;
    stages: Stage[];
    allStagesEntitiesTotal: number;

    private queryWithSearch: any = [];
    private readonly DEFAULT_PAGE_COUNT = 5;
    private readonly COMPACT_VIEW_PAGE_COUNT = 10;
    compactView: boolean;
    private stagePageCount;
    private subscribers = [];
    private _contactGroupId: ContactGroup;

    constructor(
        injector: Injector,
        private odataService: ODataService,
        private dragulaService: DragulaService,
        private pipelineService: PipelineService,
        private stageServiceProxy: StageServiceProxy,
        private changeDetector: ChangeDetectorRef,
        private filtersService: FiltersService,
        private store$: Store<CrmStore.State>,
        public userManagementService: UserManagementService,
        public dialog: MatDialog
    ) {
        super(injector);

        this.filtersService.filterFixed$.pipe(
            switchMap(() => this.pipelineService.dataLayoutType$),
            filter((dlt: DataLayoutType) => dlt === DataLayoutType.Pipeline)
        ).subscribe(() => {
            setTimeout(() => this.detectChanges(), 1000);
        });
    }

    ngOnInit() {
        this.initPipeline();
    }

    detectChanges() {
        this.changeDetector.detectChanges();
    }

    private initPipeline() {
        this.handleDragAndDrop();
        this.handleDataSource();
        this.handleContactView();
    }

    private handleDataSource() {
        this.subscribers.push(this.pipelineService.dataLayoutType$.pipe(
            filter((dlt: DataLayoutType) => dlt === DataLayoutType.Pipeline
                && (!this.pipeline || this.pipeline.contactGroupId != this.contactGroupId)),
            switchMap(() => this.pipelineService.getPipelineDefinitionObservable(this.pipelinePurposeId, this.contactGroupId)),
            map((pipeline) => {
                return this._dataSource ?
                    of(pipeline) :
                    of(pipeline).pipe(delayWhen(() => this.dataSource$));
            }),
            switchMap(pipeline => pipeline)
        ).subscribe((pipeline: PipelineDto) => {
            this.pipeline = pipeline;
            this.createStageInput.pipelineId = this.pipeline.id;
            this.mergeStagesInput.pipelineId = this.pipeline.id;
            this.onStagesLoaded.emit(pipeline);
            this.stages = pipeline.stages.map((stage: StageDto) => {
                return new Stage({
                    ...stage,
                    entities: [],
                    full: true,
                    color: this.pipelineService.getStageDefaultColorByStageSortOrder(stage.sortOrder),
                    isLoading: true,
                    stageIndex: undefined,
                    total: undefined,
                    lastStageIndex: undefined
                });
            });

            this._totalDataSource = undefined;
            if (!this.refreshTimeout) {
                this.loadData(
                    0,
                    this.stageId && this.stages.findIndex(obj => obj.id == this.stageId),
                    Boolean(this.stageId)
                );
                this.refreshTimeout = null;
            }
        }));
    }

    private handleDragAndDrop() {
        this.subscribers.push(this.dragulaService.drop.subscribe((value) => {
            setTimeout(() => this.detectChanges());
            if (value[0] == this.dragulaName) {
                let entityId = this.getAccessKey(value[1]),
                    newStage: Stage = this.getStageByElement(value[2]),
                    reloadStageList: number[] = [newStage.stageIndex],
                    newSortOrder = this.pipelineService.getEntityNewSortOrder(
                        this.getEntityById(this.getAccessKey(value[4]), newStage),
                        newStage
                    );
                if (value[1].classList.contains('selected')) {
                    const checkReloadStages = (entity, stages?: Stage[]) => {
                        this.selectedEntities.splice(this.selectedEntities.indexOf(entity), 1);
                        if (!this.selectedEntities.length)
                            this.reloadStagesInternal(reloadStageList).pipe(
                                finalize(() => {
                                    if (stages && stages.length) {
                                        stages.forEach((stage: Stage) => {
                                            stage.isLoading = false;
                                        });
                                    }
                                })
                            ).subscribe();
                    };
                    this.getSelectedEntities().forEach((entity) => {
                        let oldStage = this.stages.find(stage => stage.id == entity.StageId);
                        if (oldStage.isFinal) {
                            return checkReloadStages(entity, [oldStage]);
                        }

                        if (entity) {
                            entity.SortOrder = newSortOrder;
                            this.updateEntityStage(entity, newStage, oldStage, () => {
                                this.onEntityStageChanged && this.onEntityStageChanged.emit(entity);
                                let entities = oldStage.entities;
                                if (entity.Id != entityId)
                                    entities.splice(entities.indexOf(entity), 1);
                                if (!entities.length)
                                    reloadStageList.push(oldStage.stageIndex);
                                checkReloadStages(entity, [oldStage]);
                            });
                        }
                    });
                } else {
                    let stage = this.getStageByElement(value[3]),
                        targetEntity = this.getEntityById(entityId, stage);
                    targetEntity.SortOrder = newSortOrder;
                    if (!stage.entities.length)
                        reloadStageList.push(stage.stageIndex);

                    this.updateEntityStage(
                        targetEntity,
                        newStage,
                        stage,
                        () => {
                            this.reloadStagesInternal([newStage.stageIndex]).pipe(
                                finalize(() => stage.isLoading = false)
                            ).subscribe();
                            this.onEntityStageChanged && this.onEntityStageChanged
                                .emit(this.getEntityById(entityId, newStage));
                        }
                    );
                }
            }
        }));
        this.subscribers.push(this.dragulaService.dragend.subscribe((value) => {
            if (value[0] == this.dragulaName)
                this.hideStageHighlighting();
        }));
        const bag: any = this.dragulaService.find(this.dragulaName);
        if (bag !== undefined ) this.dragulaService.destroy(this.dragulaName);
        this.dragulaService.setOptions(this.dragulaName, {
            revertOnSpill: true,
            copySortSource: false,
            ignoreInputTextSelection: false,
            moves: (el, source) => {
                if (this.moveDisabled || this.internalMoveDisabled)
                    return false;

                let stage = this.getStageByElement(source);
                if (el.classList.contains('selected')) {
                    let cards = this.getSelectedCards();
                    if (cards.length)
                        el.setAttribute('count', [].filter.call(cards, (card) => {
                            let cardStage = this.getStageByElement(card);
                            return cardStage && !cardStage.isFinal;
                        }).length);
                }

                setTimeout(() => {
                    if (stage)
                        stage.accessibleActions.forEach((action) => {
                            if (action.targetStageId) {
                                let target = this.stages.find((stage) => {
                                    return stage.id == action.targetStageId;
                                });
                                const targetElm: HTMLElement = document.querySelector('[accessKey="' + target.id + '"]');
                                if (targetElm) {
                                    this.updateDropColumnHeight(targetElm);
                                    targetElm.classList.add('drop-area');
                                }
                            }
                        });
                });

                return stage && this.getEntityByElement(el, stage);
            },
            accepts: (el, target, source) => {
                let stageSource = this.getStageByElement(source),
                    stageTarget = this.getStageByElement(target);
                if (stageSource && stageTarget) {
                    return stageSource.id == stageTarget.id ||
                        stageSource.accessibleActions.some((action) => {
                            return action.targetStageId == stageTarget.id;
                        });
                } else
                    return false; // elements can't be dropped in any of the `containers` by default
            }
        });
    }

    /**
     * Updates drop column height in a case if source stage entity is much lower then the last entity in target stage
     * @param {HTMLElement} column
     */
    private updateDropColumnHeight(column: HTMLElement) {
        const targetElmBoundingClientRect = column.getBoundingClientRect();
        const targetElmBottom = targetElmBoundingClientRect.bottom;
        const titleBoundingClientRect = column.previousElementSibling.getBoundingClientRect();
        const titleBottom = titleBoundingClientRect.bottom;
        const difference = (titleBottom + 106 - targetElmBottom);
        /** If title is lower then target column */
        if (difference > 0) {
            /** Increase target column height to allow to drop to it */
            column.style.height = (targetElmBoundingClientRect.height + difference) + 'px';
        }
    }

    private handleContactView() {
        this.pipelineService.compactView$.pipe(takeUntil(this.destroy$)).subscribe((compactView: boolean) => {
            this.compactView = compactView;
            this.stagePageCount = compactView ? this.COMPACT_VIEW_PAGE_COUNT : this.DEFAULT_PAGE_COUNT;
            this.detectChanges();
        });
        this.pipelineService.compactView$.pipe(
            takeUntil(this.destroy$),
            /** If user choose compact view  */
            filter(Boolean),
            /** Listen dataLayoutType stream */
            switchMap(() => this.pipelineService.dataLayoutType$),
            /** Wait until layout type will became Pipeline (it may already be pipeline) */
            filter((dataLayoutType: DataLayoutType) => dataLayoutType === DataLayoutType.Pipeline),
            /** Switch to stages stream */
            switchMap(() => of(this.stages)),
            /** switch to the streams of stages items */
            mergeMap(stage => stage),
            /** filter by stages which are not full or their entities count is less then compact view items count) */
            filter((stage: Stage) => !stage.isFull && stage.entities.length < this.COMPACT_VIEW_PAGE_COUNT),
            /** Map to stages ids */
            map((stage: Stage) => stage.stageIndex),
            /** Reload entities for each filtered stage*/
            mergeMap((stageIndex: number) => this.loadStagesEntities(0, stageIndex, true, true))
        ).subscribe();
    }

    refresh(stageId?: number, skipAlreadyLoadedChecking = false) {
        this.selectedEntities = [];
        this.stageId = stageId;
        if (!this.refreshTimeout) {
            this.refreshTimeout = setTimeout(() => {
                if (this.pipeline) {
                    this.loadData(
                        0,
                        stageId && this.stages.findIndex(obj => obj.id == stageId),
                        Boolean(stageId)
                    );
                    this.refreshTimeout = null;
                } else
                    this.store$.dispatch(new PipelinesStoreActions
                        .LoadRequestAction(skipAlreadyLoadedChecking));
            });
        }
    }

    private getEntityById(id, stage: Stage) {
        return stage && stage.entities.find((entity) => {
            return entity && (entity['Id'] == id);
        });
    }

    getStageRatio(stageTotal): string {
        return ((stageTotal / this.allStagesEntitiesTotal) * 100).toFixed(1) + '%';
    }

    private getEntityByElement(el, stage) {
        return stage && this.getEntityById(parseInt(this.getAccessKey(el.closest('.card'))), stage);
    }

    private getStageByElement(el): Stage {
        return this.stages.find((stage) => {
            return stage && (stage.id == (el.getAttribute('stage') || this.getAccessKey(el)));
        });
    }

    private getAccessKey(elm) {
        return elm && elm.getAttribute('accessKey');
    }

    private checkFilterExcludeCondition(stageId) {
        return this.filterModelStages && this.filterModelStages.isSelected
            && !this.filterModelStages.items.element.value.some((item) => {
                return item.split(':').pop() == stageId;
            });
    }

    private loadData(page = 0, stageIndex?: number, oneStageOnly = false): Observable<any> {
        const entities$ = this.loadStagesEntities(page, stageIndex, oneStageOnly);
        if (this.totalsURI && !oneStageOnly)
            this.processTotalsRequest(this.queryWithSearch);
        return entities$;
    }

    private loadStagesEntities(page = 0, stageIndex?: number, oneStageOnly = false, skipTotalRequest = false): Observable<any> {
        let response = of(null),
            index = stageIndex || 0,
            stages: Stage[] = this.stages || [],
            stage: Stage = stages[index];

        if (!stage)
            return response;

        if (this.checkFilterExcludeCondition(stage.id))
            stage.entities = [];
        else {
            stage.isLoading = true;
            let filter = {StageId: stage.id},
                dataSource = this._dataSources[stage.name];

            if (!dataSource)
                dataSource = this._dataSources[stage.name] =
                    this.getDataSourceForStage(stage);

            if (!isNaN(stage.lastStageIndex) && page)
                filter['SortOrder'] = {lt: new oDataUtils.EdmLiteral(stage.lastStageIndex + 'd') };
            dataSource.pageSize(Math.max(!page && stage.entities
                && stage.entities.length || 0, this.stagePageCount));
            dataSource.sort({getter: 'SortOrder', desc: true});
            response = from(this.odataService.loadDataSource(
                dataSource,
                this._dataSource.uri + stage.id,
                this.getODataUrl(this._dataSource.uri,
                    this.queryWithSearch.concat({and: [
                        extend(filter, this._dataSource.customFilter)
                ]}))
            )).pipe(
                finalize(() => {
                    this.detectChanges();
                    if (!skipTotalRequest && oneStageOnly && stage.isFull)
                        this.processTotalsRequest(this.queryWithSearch);
                }),
                map((entities: any) => {
                    if (entities.length) {
                        stage.entities = (
                            page && oneStageOnly
                            ? uniqBy((stage.entities || []).concat(entities), (entity) => entity['Id'])
                            : entities
                        ).map((entity) => {
                            entity.StageId = stage.id;
                            entity.Stage = stage.name;
                            stage.lastStageIndex = Math.min((page ? stage.lastStageIndex : undefined) || Infinity, entity.SortOrder);
                            return entity;
                        });
                        if (!this.totalsURI)
                            stage.total = dataSource.totalCount();
                        stage.isFull = stage.entities.length >= (stage.total || 0);
                    } else  {
                        if (!page || !stage.entities)
                            stage.entities = [];
                        stage.total = stage.entities.length;
                        stage.isFull = true;
                    }
                    stage.stageIndex = index;
                    stage.isLoading = false;
                    dataSource['entities'] = stage.entities;
                    dataSource['total'] = stage.total;
                    return entities;
                })
            );
            response.subscribe(
                () => {},
                (error) => {
                    stage.isLoading = false;
                    if (error != 'canceled')
                        this.message.error(error);
                }
            );
        }

        if (!oneStageOnly && stages[index + 1])
            response = this.loadStagesEntities(page, index + 1);
        return response;
    }

    private getTotalsRequestUrl(filter) {
        return this.getODataUrl(
            this.totalsURI,
            filter.concat({and: [
                this._dataSource.customFilter
            ]})
        );
    }

    private processTotalsRequest(filter?: any) {
        if (!this._totalDataSource) {
            this._totalDataSource = new DataSource({
                requireTotalCount: false,
                store: {
                    type: 'odata',
                    url: this.getTotalsRequestUrl(filter),
                    version: AppConsts.ODataVersion,
                    beforeSend: this.getBeforeSendEvent(),
                    paginate: false
                }
            });
        } else {
            /** Update total source url in a case custom filter has changed */
            this._totalDataSource._store._url = this.getTotalsRequestUrl(filter);
        }

        if (!this._totalDataSource.isLoading()) {
            this.odataService.loadDataSource(
                this._totalDataSource,
                this.totalsURI
            ).then(
                (res) => {
                    if (res && res.length) {
                        let stages = res.pop();
                        this.allStagesEntitiesTotal = 0;
                        stages && this.stages.forEach((stage) => {
                            stage.total = stages[stage.id] || 0;
                            stage.isFull = stage.total
                                <= stage.entities.length;
                            this.allStagesEntitiesTotal += stage.total;
                            this.detectChanges();
                        });
                    }
                },
                () => this.notify.error(this.l('AnErrorOccurred'))
            );
        }
    }

    private getBeforeSendEvent(context?) {
        return (request) => {
            if (context)
                request.headers['context'] = context;
            request.params.contactGroupId = this.contactGroupId;
            request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
            request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
        };
    }

    private getDataSourceForStage(stage) {
        let config = clone(this._dataSource);
        config.store.beforeSend = this.getBeforeSendEvent(stage.id);

        return new DataSource(extend(config, {
            onLoadError: (error) => { this.httpInterceptor.handleError(error); },
            requireTotalCount: !this.totalsURI,
            select: this.selectFields.concat('SortOrder'),
        }));
    }

    private get internalMoveDisabled() {
        return this.stages && this.stages.some((stage: Stage) => stage.isLoading);
    }

    processODataFilter(grid, uri, filters, getCheckCustom, instanceData = null) {
        this.queryWithSearch = filters.map((filter) => {
            return getCheckCustom && getCheckCustom(filter) ||
                filter.getODataFilterObject();
        }).concat(this.getSearchFilter());
        this.loadData();
        return this.queryWithSearch;
    }

    loadMore(stageIndex): Observable<any> {
        return this.loadData(
            Math.floor(this.stages[stageIndex].entities.length
                / this.stagePageCount), stageIndex, true
        );
    }

    private reloadStagesInternal(stageIndexList: number[]): Observable<any> {
        return forkJoin.apply(this,
            stageIndexList.filter((val, index) => stageIndexList.indexOf(val) == index)
                          .map((stageIndex) => this.loadData(0, stageIndex, true))
        );
    }

    private updateEntityStage(entity, newStage: Stage, oldStage: Stage, complete = null) {
        if (entity && entity.Id) {
            setTimeout(() => {
                newStage.isLoading = oldStage.isLoading = true;
                if (newStage.name != oldStage.name) {
                    this.pipelineService.updateEntityStage(
                        this.pipelinePurposeId, entity, oldStage, newStage, complete
                    );
                } else
                    this.pipelineService.updateEntitySortOrder(this.pipeline.id, entity, complete);
            });
        }
    }

    private destroyPipeline() {
        this.dragulaService.destroy(this.dragulaName);
        this.subscribers.forEach((sub) => sub.unsubscribe());
        this.subscribers = [];
    }

    ngOnDestroy() {
        this.destroyPipeline();
    }

    getDateWithTimezone(utcDateTime) {
        if (utcDateTime)
            return new Date(moment(utcDateTime).format('YYYY/MM/DD HH:mm:ss'));
    }

    hideStageHighlighting() {
        [].forEach.call(document.querySelectorAll('.drop-area'), (el) => {
            el.classList.remove('drop-area');
            el.style.height = 'initial';
        });
    }

    private getSelectedCards() {
        return document.getElementsByClassName('card selected');
    }

    getSelectedEntities() {
        return this.stages.reduce((selectedEntities, stage: Stage) => {
            return selectedEntities.concat(this.getStageSelectedEntities(stage));
        }, []);
    }

    private getStageById(stageId: number): Stage {
        return this.stages.find(stage => stage.id === stageId);
    }

    private toogleHighlightShiftArea(entity, checked: boolean) {
        if (this.shiftStartEntity &&
            this.shiftStartEntity.StageId == entity.StageId
        ) {
            const stage = this.getStageById(entity.StageId);
            let startEntityIndex: any = stage.entities.findIndex(entity => entity.Id === this.shiftStartEntity.Id);
            let endEntityIndex: any = stage.entities.findIndex(e => e.Id === entity.Id);
            if (startEntityIndex > endEntityIndex) {
                [ startEntityIndex, endEntityIndex ] = [ endEntityIndex, startEntityIndex ];
            }

            while (startEntityIndex < endEntityIndex) {
                stage.entities[startEntityIndex].selected = checked;
                startEntityIndex++;
            }
        } else
            this.shiftStartEntity = entity;
    }

    deselectAllCards() {
        if (this.stages)
            this.stages.forEach(stage => stage.entities.forEach(entity => entity.selected = false));
    }

    private onKeyUp(event) {
        if (event.keyCode == 16/*SHIFT*/)
            this.shiftStartEntity = null;
    }

    private onResize() {
        this.detectChanges();
    }

    getStageSelectedEntitiesCount(stage): number {
        const stageSelectedEntities = this.getStageSelectedEntities(stage);
        return stageSelectedEntities.length;
    }

    private getStageSelectedEntities(stage) {
        return stage.entities.filter(entity => entity.selected);
    }

    allEntitiesAreSelected(stage): boolean {
        return stage.entities.every(entity => entity.selected);
    }

    toggleAllEntitiesInStage(e, stage) {
        if (e.event) {
            stage.entities.forEach(entity => {
                entity.selected = e.value;
            });
            this.selectedEntities = this.getSelectedEntities();
        }
    }

    onCardClickInternal(entity, event) {
        let clickedOnCheckbox = event.target.classList.contains('dx-checkbox');
        if (event.ctrlKey || event.shiftKey || clickedOnCheckbox) {
            entity.selected = !entity.selected;
            if (!entity.selected && event.ctrlKey && event.shiftKey)
                this.deselectAllCards();
            else if (event.shiftKey)
                this.toogleHighlightShiftArea(entity, entity.selected);
            this.selectedEntities = this.getSelectedEntities();
        } else {
            this.onCardClick.emit({
                entity: entity,
                entityStageDataSource: this._dataSources[entity.Stage],
                loadMethod: this.loadMore.bind(this, this.stages.findIndex(stage => stage.id === entity.StageId))
            });
        }
        this.hideStageHighlighting();
    }

    onTooltipShowing(event) {
        this.currentTooltip = event.component;
        event.component.content().classList.add('pipeline-actions');
    }

    updateStage(stage: Stage, actionType: string) {
        this.currentTooltip.hide();
        this.createStageInput.sortOrder = stage.sortOrder + (stage.sortOrder >= 0 ? 1 : -1);
        this.mergeStagesInput.sourceStageId = this.renameStageInput.id = stage.id;
        this.dialog.open(AddRenameMergeDialogComponent, {
            height: '300px',
            width: '270px',
            id: actionType + '-Stage',
            data: {
                dialogTitle: this.l(actionType + '_Stage_Title'),
                placeholder: this.l(actionType + '_Stage_Placeholder'),
                newStageName: null,
                entities: stage.entities,
                stages: this.stages,
                currentStageId: stage.id,
                currentStageName: stage.name,
                moveToStage: null,
                actionType: actionType
            }
        }).afterClosed().subscribe(result => {
            switch (actionType) {
                case 'Add':
                    if (result && result.newStageName) {
                        this.createStageInput.name = result.newStageName;
                        this.stageServiceProxy.createStage(this.createStageInput).subscribe(() => {
                            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                        });
                    }
                    break;
                case 'Rename':
                    if (result && result.newStageName) {
                        this.renameStageInput.name = result.newStageName;
                        this.stageServiceProxy.renameStage(this.renameStageInput).subscribe(() => {
                            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                        });
                    }
                    break;
                case 'Merge':
                    if (result && result.moveToStage) {
                        this.mergeStagesInput.destinationStageId = result.moveToStage;
                        this.stageServiceProxy.mergeStages(this.mergeStagesInput).subscribe(() => {
                                this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                            }
                        );
                    } else if (result && !result.moveToStage) {
                        this.stageServiceProxy.mergeStages(this.mergeStagesInput).subscribe(() => {
                            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                        });
                    }
                    break;
            }

        });
    }

    private getStages(reverse?: boolean) {
        return reverse ? clone(this.stages).reverse() : this.stages;
    }

    private getTargetStage(stage: Stage, reverse: boolean): Stage {
        let result;
        this.getStages(reverse).some((lookupStage: Stage) => {
            if (stage.id == lookupStage.id)
                return true;
            else
                result = lookupStage;
        });
        return result;
    }

    moveStage(stage: Stage, reverse: boolean) {
        stage.isLoading = true;
        if (this.disallowMove(stage, reverse))
            return ;

        let direction = reverse ? 1 : -1,
            targetStage: Stage = this.getTargetStage(stage, reverse),
            sortOrder;
        targetStage.isLoading = true;
        const stageIsNegative = stage.sortOrder < 0,
              moveNegativeToRight = stageIsNegative && reverse,
              moveNegativeToLeft = stageIsNegative && !reverse,
              movePositiveToLeft = !stageIsNegative && !reverse,
              movePositiveToRight = !stageIsNegative && reverse;
        if (moveNegativeToRight || movePositiveToLeft) {
            sortOrder = targetStage.sortOrder || direction;
        } else if (moveNegativeToLeft || movePositiveToRight) {
            sortOrder = targetStage.sortOrder + direction;
        }
        this.stageServiceProxy.updateStageSortOrder(new UpdateSortOrderInput({
            id: stage.id,
            sortOrder: sortOrder
        })).pipe(
            finalize(() => {
                stage.isLoading = targetStage.isLoading = false;
            })
        ).subscribe(() => {
            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    disallowDelete(stage: Stage) {
        return !stage.sortOrder || stage.isFinal;
    }

    disallowMove(stage, reverse?) {
        let targetStage;
        return !stage.sortOrder || stage.isFinal ||
            this.getStages(reverse).some((lookupStage, index) => {
                if (lookupStage.id == stage.id && (targetStage && targetStage.isFinal || !index))
                    return true;
                else
                    targetStage = lookupStage;
            });
    }

    hideBankCodeTooltip(entityId: number) {
        this.bankCodeTooltips.some((bankCodeTooltip: DxoTooltipComponent) => {
            if (bankCodeTooltip.instance.option('target') === '#bankCode' + entityId) {
                bankCodeTooltip.instance.hide();
                return true;
            }
            return false;
        });
        this.changeDetector.markForCheck();
    }

    getStageSpinnerTopPosition(stage: Stage): string {
        let topPosition = '123px';
        if (stage && stage.entities && stage.entities.length) {
            topPosition = (window.innerHeight - document.querySelector('.column-title').getBoundingClientRect().top) / 2 - 30 + 'px';
        }
        return topPosition;
    }
}
