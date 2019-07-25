/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, EventEmitter,
    HostBinding, Output, Input, OnInit, OnDestroy } from '@angular/core';

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
import find from 'lodash/find';
import findIndex from 'lodash/findIndex';
import clone from 'lodash/clone';
import uniqBy from 'lodash/uniqBy';

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

@Component({
    selector: 'app-pipeline',
    templateUrl: './pipeline.component.html',
    styleUrls: ['./pipeline.component.less'],
    providers: [ StageServiceProxy ],
    host: {
        '(window:keyup)': 'onKeyUp($event)',
        '(window:resize)': 'onResize($event)'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineComponent extends AppComponentBase implements OnInit, OnDestroy {
    @HostBinding('class.disabled') public disabled = false;
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
    stages: StageDto[];
    allStagesEntitiesTotal: number;

    private queryWithSearch: any = [];
    private readonly DEFAULT_PAGE_COUNT = 5;
    private readonly COMPACT_VIEW_PAGE_COUNT = 10;
    compactView: boolean;
    private stagePageCount;
    private subscribers = [];
    private _contactGroupId: ContactGroup;

    constructor(injector: Injector,
        private _odataService: ODataService,
        private _dragulaService: DragulaService,
        private _pipelineService: PipelineService,
        private _stageServiceProxy: StageServiceProxy,
        private _changeDetector: ChangeDetectorRef,
        private _filtersService: FiltersService,
        private store$: Store<CrmStore.State>,
        public dialog: MatDialog
    ) {
        super(injector);

        this._filtersService.filterFixed$.pipe(
            switchMap(() => this._pipelineService.dataLayoutType$),
            filter((dlt: DataLayoutType) => dlt === DataLayoutType.Pipeline)
        ).subscribe(() => {
            setTimeout(() => this.detectChanges(), 1000);
        });
    }

    detectChanges() {
        this._changeDetector.detectChanges();
    }

    private initPipeline() {
        this.startLoading();
        this.subscribers.push(this._dragulaService.drop.subscribe((value) => {
            setTimeout(() => this.detectChanges());
            if (value[0] == this.dragulaName) {
                let entityId = this.getAccessKey(value[1]),
                    newStage = this.getStageByElement(value[2]),
                    reloadStageList = [newStage['stageIndex']],
                    newSortOrder = this._pipelineService.getEntityNewSortOrder(
                        this.getEntityById(this.getAccessKey(value[4]), newStage), newStage);

                if (value[1].classList.contains('selected')) {
                    const checkReloadStages = (entity) => {
                        this.selectedEntities.splice(this.selectedEntities.indexOf(entity), 1);
                        if (!this.selectedEntities.length)
                            this.reloadStagesInternal(reloadStageList);
                    };
                    this.getSelectedEntities().forEach((entity) => {
                        let oldStage = this.stages.find(stage => stage.id == entity.StageId);
                        if (oldStage['isFinal'])
                            return checkReloadStages(entity);

                        if (entity) {
                            entity.SortOrder = newSortOrder;
                            this.updateEntityStage(entity, newStage, oldStage, () => {
                                this.onEntityStageChanged && this.onEntityStageChanged.emit(entity);
                                let entities = oldStage['entities'];
                                if (entity.Id != entityId)
                                    entities.splice(entities.indexOf(entity), 1);
                                if (!entities.length)
                                    reloadStageList.push(oldStage['stageIndex']);
                                checkReloadStages(entity);
                            });
                        }
                    });
                } else {
                    let stage = this.getStageByElement(value[3]),
                        targetEntity = this.getEntityById(entityId, stage);
                    targetEntity.SortOrder = newSortOrder;
                    if (!stage['entities'].length)
                        reloadStageList.push(stage['stageIndex']);

                    this.updateEntityStage(targetEntity,
                        newStage, stage, () => {
                            this.reloadStagesInternal([newStage['stageIndex']]);
                            this.onEntityStageChanged && this.onEntityStageChanged
                                .emit(this.getEntityById(entityId, newStage));
                        }
                    );
                }
            }
        }));
        this.subscribers.push(
            this._dragulaService.dragend.subscribe((value) => {
                if (value[0] == this.dragulaName)
                    this.hideStageHighlighting();
            })
        );
        this.subscribers.push(
            this._pipelineService.dataLayoutType$.pipe(
                filter((dlt: DataLayoutType) => dlt === DataLayoutType.Pipeline
                    && (!this.pipeline || this.pipeline.contactGroupId != this.contactGroupId)),
                switchMap(() => this._pipelineService.getPipelineDefinitionObservable(this.pipelinePurposeId, this.contactGroupId)),
                map((pipeline) => {
                    return this._dataSource ?
                        of(pipeline) :
                        of(pipeline).pipe(delayWhen(() => {
                            return this.dataSource$;
                        }));
                }), switchMap(pipeline => pipeline)
            ).subscribe((pipeline: PipelineDto) => {
                this.pipeline = pipeline;
                this.createStageInput.pipelineId = this.pipeline.id;
                this.mergeStagesInput.pipelineId = this.pipeline.id;

                this.onStagesLoaded.emit(pipeline);
                this.stages = pipeline.stages.map((stage) => {
                    extend(stage, {
                        entities: [],
                        full: true
                    });
                    return stage;
                });

                this._totalDataSource = undefined;
                if (!this.refreshTimeout) {
                    this.loadData(0, this.stageId && findIndex(this.stages,  obj => obj.id == this.stageId), Boolean(this.stageId));
                    this.refreshTimeout = null;
                }
            })
        );
        const bag: any = this._dragulaService.find(this.dragulaName);
        if (bag !== undefined ) this._dragulaService.destroy(this.dragulaName);
        this._dragulaService.setOptions(this.dragulaName, {
            revertOnSpill: true,
            copySortSource: false,
            ignoreInputTextSelection: false,
            moves: (el, source) => {
                if (this.moveDisabled)
                    return false;

                let stage = this.getStageByElement(source);
                if (el.classList.contains('selected')) {
                    let cards = this.getSelectedCards();
                    if (cards.length)
                        el.setAttribute('count', [].filter.call(cards, (card) => {
                            let cardStage = this.getStageByElement(card);
                            return cardStage && !cardStage['isFinal'];
                        }).length);
                }

                setTimeout(() => {
                    if (stage)
                        stage.accessibleActions.forEach((action) => {
                            if (action.targetStageId) {
                                let target = find(this.stages, (stage) => {
                                    return stage.id == action.targetStageId;
                                }), targetElm = document.querySelector('[accessKey="' + target.id + '"]');
                                targetElm && targetElm.classList.add('drop-area');
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

        this._pipelineService.compactView$.pipe(takeUntil(this.destroy$)).subscribe((compactView: boolean) => {
            this.compactView = compactView;
            this.stagePageCount = compactView ? this.COMPACT_VIEW_PAGE_COUNT : this.DEFAULT_PAGE_COUNT;
            this.detectChanges();
        });
        this._pipelineService.compactView$.pipe(
            takeUntil(this.destroy$),
            /** If user choose compact view  */
            filter((compactView: boolean) => compactView),
            /** Listen dataLayoutType stream */
            switchMap(() => this._pipelineService.dataLayoutType$),
            /** Wait until layout type will became Pipeline (it may already be pipeline) */
            filter((dataLayoutType: DataLayoutType) => dataLayoutType === DataLayoutType.Pipeline),
            /** Switch to stages stream */
            switchMap(() => of(this.stages)),
            /** switch to the streams of stages items */
            mergeMap(stage => stage),
            /** filter by stages which are not full or their entities count is less then compact view items count) */
            filter((stage: StageDto) => !stage['full'] && stage['entities'].length < this.COMPACT_VIEW_PAGE_COUNT),
            /** Map to stages ids */
            map((stage: StageDto) => stage['stageIndex']),
            /** Reload entities for each filtered stage*/
            mergeMap((stageIndex: number) => this.loadStagesEntities(0, stageIndex, true, true))
        ).subscribe();
    }

    ngOnInit() {
        this.initPipeline();
    }

    refresh(quiet = false, stageId?: number, skipAlreadyLoadedChecking = false) {
        this.selectedEntities = [];
        this.stageId = stageId;
        if (!this.refreshTimeout) {
            !quiet && this.startLoading();
            this.refreshTimeout = setTimeout(() => {
                if (this.pipeline) {
                    this.loadData(0, stageId &&
                        findIndex(this.stages, obj => obj.id == stageId), Boolean(stageId));
                    this.refreshTimeout = null;
                } else
                    this.store$.dispatch(new PipelinesStoreActions
                        .LoadRequestAction(skipAlreadyLoadedChecking));
            });
        }
    }

    getEntityById(id, stage) {
        return stage && find(stage.entities, (entity) => {
            return entity && (entity['Id'] == id);
        });
    }

    getStageRatio(stageTotal): string {
        return ((stageTotal / this.allStagesEntitiesTotal) * 100).toFixed(1) + '%';
    }

    getEntityByElement(el, stage) {
        return stage && this.getEntityById(parseInt(this.getAccessKey(el.closest('.card'))), stage);
    }

    getStageByElement(el) {
        return find(this.stages, (stage) => {
            return stage && (stage.id == (el.getAttribute('stage') || this.getAccessKey(el)));
        });
    }

    getAccessKey(elm) {
        return elm && elm.getAttribute('accessKey');
    }

    checkFilterExcludeCondition(stageId) {
        return this.filterModelStages && this.filterModelStages.isSelected
            && !this.filterModelStages.items.element.value.some((item) => {
                return item.split(':').pop() == stageId;
            });
    }

    loadData(page = 0, stageIndex?: number, oneStageOnly = false): Observable<any> {
        const entities$ = this.loadStagesEntities(page, stageIndex, oneStageOnly);
        if (this.totalsURI && !oneStageOnly)
            this.processTotalsRequest(this.queryWithSearch);
        return entities$;
    }

    loadStagesEntities(page = 0, stageIndex?: number, oneStageOnly = false, skipTotalRequest = false): Observable<any> {
        let response = of(null),
            index = stageIndex || 0,
            stages = this.stages || [],
            stage = stages[index];

        if (!stage)
            return response;

        if (this.checkFilterExcludeCondition(stage.id))
            stage['entities'] = [];
        else {
            let filter = {StageId: stage.id},
                dataSource = this._dataSources[stage.name];

            if (!dataSource)
                dataSource = this._dataSources[stage.name] =
                    this.getDataSourceForStage(stage);

            if (!isNaN(stage['lastSortOrder']) && page)
                filter['SortOrder'] = {lt: stage['lastSortOrder']};

            dataSource.pageSize(Math.max(!page && stage['entities']
                && stage['entities'].length || 0, this.stagePageCount));
            dataSource.sort({getter: 'SortOrder', desc: true});
            response = from(this._odataService.loadDataSource(
                dataSource,
                this._dataSource.uri + stage.id,
                this.getODataUrl(this._dataSource.uri,
                    this.queryWithSearch.concat({and: [
                        extend(filter, this._dataSource.customFilter)
                ]}))
            )).pipe(
                finalize(() => {
                    if (this.isAllStagesLoaded())
                        setTimeout(() => {
                            this.finishLoading();
                            this.detectChanges();
                        });
                    if (!skipTotalRequest && oneStageOnly && stage['full'])
                        this.processTotalsRequest(this.queryWithSearch);
                }),
                map((entities: any) => {
                    if (entities.length) {
                        stage['entities'] = (page && oneStageOnly ? uniqBy(
                            (stage['entities'] || []).concat(entities), (entity) => entity['Id']) : entities).map((entity) => {
                            stage['lastSortOrder'] = Math.min((page ? stage['lastSortOrder'] : undefined) || Infinity, entity.SortOrder);
                            return entity;
                        });
                        if (!this.totalsURI)
                            stage['total'] = dataSource.totalCount();
                        stage['full'] = stage['entities'].length >= (stage['total'] || 0);
                    } else  {
                        if (!page || !stage['entities'])
                            stage['entities'] = [];
                        stage['total'] = stage['entities'].length;
                        stage['full'] = true;
                    }
                    stage['stageIndex'] = index;
                    dataSource['entities'] = stage['entities'];
                    dataSource['total'] = stage['total'];
                    return entities;
                })
            );
            response.subscribe(() => {}, (error) => {
                if (error != 'canceled')
                    this.message.error(error);
            });
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

    processTotalsRequest(filter?: any) {
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
            this._odataService.loadDataSource(
                this._totalDataSource,
                this.totalsURI
            ).done((res) => {
                let stages = res.pop();
                this.allStagesEntitiesTotal = 0;
                stages && this.stages.forEach((stage) => {
                    stage['total'] = stages[stage.id] || 0;
                    stage['full'] = stage['total']
                        <= stage['entities'].length;
                    this.allStagesEntitiesTotal += stage['total'];
                });
                this.detectChanges();
            });
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

    isAllStagesLoaded() {
        return Object['values'](this._dataSources)
            .every(dataSource => (dataSource.isLoaded() && !dataSource.isLoading()));
    }

    processODataFilter(grid, uri, filters, getCheckCustom, instanceData = null) {
        this.queryWithSearch = filters.map((filter) => {
            return getCheckCustom && getCheckCustom(filter) ||
                filter.getODataFilterObject();
        }).concat(this.getSearchFilter());

        this.startLoading();
        this.loadData();

        return this.queryWithSearch;
    }

    startLoading(global?) {
        super.startLoading(global);
        this.disabled = true;
    }

    finishLoading(global?) {
        super.finishLoading(global);
        this.disabled = false;
    }

    loadMore(stageIndex): Observable<any> {
        this.startLoading();
        return this.loadData(
            Math.floor(this.stages[stageIndex]['entities'].length
                / this.stagePageCount), stageIndex, true);
    }

    private reloadStagesInternal(stageIndexList) {
        this.disabled = true;
        forkJoin.apply(this, stageIndexList.filter(
            (val, index) => stageIndexList.indexOf(val) == index
        ).map((stageIndex) => {
            return this.loadData(0, stageIndex, true);
        })).pipe(
            finalize(() => {
                this.disabled = false;
                this.finishLoading();
                this.detectChanges();
            })
        ).subscribe();
    }

    updateEntityStage(entity, newStage, oldStage, complete = null) {
        if (entity && entity.Id) {
            this.disabled = true;
            setTimeout(() => {
                this.startLoading();
                if (newStage.name != oldStage.name) {
                    this._pipelineService.updateEntityStage(
                        this.pipelinePurposeId, entity, oldStage, newStage, complete);
                } else
                    this._pipelineService.updateEntitySortOrder(this.pipeline.id, entity, complete);
            });
        }
    }

    destroyPipeline() {
        this._dragulaService.destroy(this.dragulaName);
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
        });
    }

    getSelectedCards() {
        return document.getElementsByClassName('card selected');
    }

    getSelectedEntities() {
        return this.stages.reduce((selectedEntities, stage) => {
            return selectedEntities.concat(this.getStageSelectedEntities(stage));
        }, []);
    }

    private getStageById(stageId: number): StageDto {
        return this.stages.find(stage => stage.id === stageId);
    }

    private toogleHighlightShiftArea(entity, checked: boolean) {
        if (this.shiftStartEntity &&
            this.shiftStartEntity.StageId == entity.StageId
        ) {
            const stage = this.getStageById(entity.StageId);
            let startEntityIndex: any = stage['entities'].findIndex(entity => entity.Id === this.shiftStartEntity.Id);
            let endEntityIndex: any = stage['entities'].findIndex(e => e.Id === entity.Id);
            if (startEntityIndex > endEntityIndex) {
                [ startEntityIndex, endEntityIndex ] = [ endEntityIndex, startEntityIndex ];
            }

            while (startEntityIndex < endEntityIndex) {
                stage['entities'][startEntityIndex].selected = checked;
                startEntityIndex++;
            }
        } else
            this.shiftStartEntity = entity;
    }

    deselectAllCards() {
        if (this.stages)
            this.stages.forEach(stage => stage['entities'].forEach(entity => entity.selected = false));
    }

    onKeyUp(event) {
        if (event.keyCode == 16/*SHIFT*/)
            this.shiftStartEntity = null;
    }

    onResize(event) {
        this.detectChanges();
    }

    getStageSelectedEntitiesCount(stage): number {
        const stageSelectedEntities = this.getStageSelectedEntities(stage);
        return stageSelectedEntities.length;
    }

    getStageSelectedEntities(stage) {
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

    updateStage(data, actionType) {
        this.currentTooltip.hide();
        this.createStageInput.sortOrder = data.sortOrder + (data.sortOrder >= 0 ? 1 : -1);
        this.mergeStagesInput.sourceStageId = this.renameStageInput.id = data.id;
        this.dialog.open(AddRenameMergeDialogComponent, {
            height: '300px',
            width: '270px',
            id: actionType + '-Stage',
            data: {
                dialogTitle: this.l(actionType + '_Stage_Title'),
                placeholder: this.l(actionType + '_Stage_Placeholder'),
                newStageName: null,
                entities: data.entities,
                stages: this.stages,
                currentStageId: data.id,
                currentStageName: data.name,
                moveToStage: null,
                actionType: actionType
            }
        }).afterClosed().subscribe(result => {
            switch (actionType) {
                case 'Add':
                    if (result && result.newStageName) {
                        this.createStageInput.name = result.newStageName;
                        this._stageServiceProxy.createStage(this.createStageInput).subscribe(() => {
                            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                        });
                    }
                    break;
                case 'Rename':
                    if (result && result.newStageName) {
                        this.renameStageInput.name = result.newStageName;
                        this._stageServiceProxy.renameStage(this.renameStageInput).subscribe(() => {
                            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                        });
                    }
                    break;
                case 'Merge':
                    if (result && result.moveToStage) {
                        this.mergeStagesInput.destinationStageId = result.moveToStage;
                        this._stageServiceProxy.mergeStages(this.mergeStagesInput).subscribe(() => {
                                this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                            }
                        );
                    } else if (result && !result.moveToStage) {
                        this._stageServiceProxy.mergeStages(this.mergeStagesInput).subscribe(() => {
                            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                        });
                    }
                    break;
            }

        });
    }

    getStages(reverse?) {
        return reverse ? clone(this.stages).reverse() : this.stages;
    }

    getTargetStage(stage: StageDto, reverse: boolean) {
        let result;
        this.getStages(reverse).some((lookupStage: StageDto) => {
            if (stage.id == lookupStage.id)
                return true;
            else
                result = lookupStage;
        });
        return result;
    }

    moveStage(stage: StageDto, reverse) {
        if (this.disallowMove(stage, reverse))
            return ;

        let direction = reverse ? 1 : -1,
            targetStage: StageDto = this.getTargetStage(stage, reverse),
            sortOrder;
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

        this.startLoading(true);
        this._stageServiceProxy.updateStageSortOrder(new UpdateSortOrderInput({
            id: stage.id,
            sortOrder: sortOrder
        })).pipe(
            finalize(() => {
                setTimeout(() => this.finishLoading(true), 500);
            })
        ).subscribe(() => {
            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
            this.notify.info(this.l('SavedSuccessfully'));
        });
    }

    disallowDelete(stage) {
        return !stage.sortOrder || stage['isFinal'];
    }

    disallowMove(stage, reverse?) {
        let targetStage;
        return !stage.sortOrder || stage['isFinal'] ||
            this.getStages(reverse).some((lookupStage, index) => {
                if (lookupStage.id == stage.id && (targetStage && targetStage['isFinal'] || !index))
                    return true;
                else
                    targetStage = lookupStage;
            });
    }
}