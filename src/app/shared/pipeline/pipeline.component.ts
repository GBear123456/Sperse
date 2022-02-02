/** Core imports */
import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, EventEmitter,
    Output, Input, OnInit, OnDestroy, ViewChildren, QueryList, SimpleChanges
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import oDataUtils from 'devextreme/data/odata/utils';
import dxTooltip from 'devextreme/ui/tooltip';
import { Observable, Subject, from, of, forkJoin } from 'rxjs';
import { filter, finalize, delayWhen, map, mergeMap, switchMap, takeUntil, tap } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';
import * as moment from 'moment';
import extend from 'lodash/extend';
import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';
import uniqBy from 'lodash/uniqBy';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { ODataService } from '@shared/common/odata/odata.service';
import { CrmStore, PipelinesStoreActions } from '@app/crm/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    PipelineDto,
    StageServiceProxy,
    CreateStageInput,
    RenameStageInput,
    MergeStagesInput,
    UpdateSortOrderInput,
    InvoiceSettings
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { PipelineService } from './pipeline.service';
import { ActionMenuService } from '@app/shared/common/action-menu/action-menu.service';
import { CheckListDialogComponent } from './check-list-dialog/check-list-dialog.component';
import { EntityCheckListDialogComponent } from '@app/crm/shared/entity-check-list-dialog/entity-check-list-dialog.component';
import { AddRenameMergeDialogComponent } from './add-rename-merge-dialog/add-rename-merge-dialog.component';
import { ContactGroup } from '@shared/AppEnums';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { FiltersService } from '@shared/filters/filters.service';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DxoTooltipComponent } from 'devextreme-angular/ui/nested/tooltip';
import { Stage } from '@app/shared/pipeline/stage.model';
import { StageWidth } from '@app/shared/pipeline/stage-width.enum';
import { InstanceModel } from '@shared/cfo/instance.model';
import { Param } from '@shared/common/odata/param.model';
import { FilterModel } from '@shared/filters/models/filter.model';
import { ODataRequestValues } from '@shared/common/odata/odata-request-values.interface';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';
import { AppPermissions } from '@shared/AppPermissions';
import { EntityTypeSys } from '@app/crm/leads/entity-type-sys.enum';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';

@Component({
    selector: 'app-pipeline',
    templateUrl: './pipeline.component.html',
    styleUrls: ['./pipeline.component.less'],
    providers: [ StageServiceProxy, CurrencyPipe ],
    host: {
        '(window:keyup)': 'onKeyUp($event)',
        '(window:resize)': 'onResize()'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipelineComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChildren('bankCodeTooltip') bankCodeTooltips: QueryList<DxoTooltipComponent>;
    @Output() onStagesLoaded: EventEmitter<PipelineDto> = new EventEmitter<PipelineDto>();
    @Output() onCardClick: EventEmitter<any> = new EventEmitter<any>();
    @Output() onEntityStageChanged: EventEmitter<any> = new EventEmitter<any>();
    @Output() onTotalChange: EventEmitter<number> = new EventEmitter<number>();

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
    @Input() actionMenuGroups: ActionMenuGroup[];
    @Input() moveDisabled = false;
    @Input() dragulaName = 'stage';
    @Input() totalsURI: string;
    @Input() selectFields: string[];
    @Input() filterModelStages: any;
    @Input('source')
    set source(source: DataSource) {
        if (this._dataSource = source)
            this.dataSource$.next(source);
    }
    @Input() pipelinePurposeId: string;
    @Input() pipelineId: number;
    @Input() contactGroupId: ContactGroup;
    @Input() dateField: string;

    pipeline: PipelineDto;
    stages: Stage[];
    allStagesEntitiesTotal: number;
    isConfigureAllowed = this.isGranted(AppPermissions.CRMPipelinesConfigure);
    get isChecklistAllowed(): boolean {
        return [AppConsts.PipelinePurposeIds.lead, AppConsts.PipelinePurposeIds.order].indexOf(this.pipeline.purpose) >= 0;
    }
    private queryWithSearch: any = [];
    params: any = [];
    private readonly DEFAULT_PAGE_COUNT = 10;
    private readonly COMPACT_VIEW_PAGE_COUNT = 10;
    compactView: boolean;
    private stagePageCount;
    private subscribers = [];
    stageWidths = StageWidth;
    stageColumnWidths: string[] = Object.keys(StageWidth);
    private readonly COLUMN_WIDTHS_CACHE_KEY = 'COLUMN_WIDTHS';
    searchValue = this._activatedRoute.snapshot.queryParams.search || '';
    searchClear = false;
    actionEvent: any;
    currency: string;

    constructor(
        injector: Injector,
        private currencyPipe: CurrencyPipe,
        private odataService: ODataService,
        private dragulaService: DragulaService,
        private pipelineService: PipelineService,
        private invoicesService: InvoicesService,
        private stageServiceProxy: StageServiceProxy,
        private changeDetector: ChangeDetectorRef,
        private filtersService: FiltersService,
        private store$: Store<CrmStore.State>,
        private cacheService: CacheService,
        public userManagementService: UserManagementService,
        public dialog: MatDialog
    ) {
        super(injector);

        invoicesService.settings$.pipe(
            filter(Boolean)
        ).subscribe((res: InvoiceSettings) => {
            this.currency = res.currency;
        });

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

    ngOnChanges(changes: SimpleChanges) {
        if ((changes.pipelineId && !changes.pipelineId.firstChange
            && changes.pipelineId.currentValue !== changes.pipelineId.previousValue
            ) || (changes.contactGroupId && !changes.contactGroupId.firstChange
            && changes.contactGroupId.currentValue !== changes.contactGroupId.previousValue)
        ) {
            this.reinitPipeline();
        }
    }

    detectChanges() {
        this.changeDetector.detectChanges();
    }

    getEntityName(entity: any): string {
        let entityName: string;
        if (entity) {
            let prioritizedName = entity.Name;
            if (this.pipeline.entityTypeSysId === EntityTypeSys.PropertyAcquisition) {
                prioritizedName = entity.PropertyName;
            }
            entityName = prioritizedName || entity.Title || entity.Email || entity.Phone || entity.CompanyName;
        }
        return entityName;
    }

    getEntitySubtitle(entity: any): string {
        let subtitle: string;
        if (entity) {
            let prioritizedSubtitle = this.currencyPipe.transform(entity.Amount, this.currency);
            if (this.pipeline.entityTypeSysId && this.pipeline.entityTypeSysId.startsWith(EntityTypeSys.PropertyRentAndSale)) {
                prioritizedSubtitle = prioritizedSubtitle || entity.PropertyName;
            } else if (this.pipeline.entityTypeSysId === EntityTypeSys.PropertyAcquisition) {
                prioritizedSubtitle = prioritizedSubtitle || entity.Name;
            } else {
                prioritizedSubtitle = entity.Name || entity.Title
                    || entity.Email || entity.Phone ? prioritizedSubtitle || entity.CompanyName : '';
            }
            subtitle = prioritizedSubtitle || entity.Description;
        }
        return subtitle;
    }

    private reinitPipeline() {
        this.destroyPipeline();
        setTimeout(this.initPipeline.bind(this), 100);
    }

    private initPipeline() {
        this.handleDragAndDrop();
        this.handleDataSource();
        this.handleContactView();
    }

    private handleDataSource() {
        this.subscribers.push(this.pipelineService.dataLayoutType$.pipe(
            filter(() => !this.pipeline || this.pipeline.contactGroupId != this.contactGroupId
                || (this.pipelineId && this.pipeline.id !== this.pipelineId)),
            switchMap(() => this.pipelineService.getPipelineDefinitionObservable(
                this.pipelinePurposeId,
                this.contactGroupId,
                this.pipelineId
            )),
            map((pipeline: PipelineDto) => {
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
            this.stages = pipeline.stages.map((stage: Stage) => {
                const columnWidthsCache = this.cacheService.get(this.getColumnWidthsCacheKey());
                return new Stage({
                    ...stage,
                    entities: [],
                    full: true,
                    color: this.pipelineService.getStageDefaultColorByStageSortOrder(stage.sortOrder),
                    isLoading: true,
                    stageIndex: undefined,
                    total: undefined,
                    lastStageIndex: undefined,
                    width: columnWidthsCache && columnWidthsCache[stage.id]
                        ? columnWidthsCache[stage.id]
                        : stage.sortOrder === 0 ? StageWidth.Wide : StageWidth.Medium
                });
            });

            this._totalDataSource = undefined;
            if (!this.refreshTimeout) {
                /** If there is stage filter - clear it and update */
                if (this.filterModelStages) {
                    this.filterModelStages.items.element.value = [];
                    this.filtersService.change([this.filterModelStages]);
                } else {
                    /** Else - load the data */
                    this.loadData(
                        0,
                        this.stageId && this.stages.findIndex(obj => obj.id == this.stageId),
                        Boolean(this.stageId)
                    );
                }
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
                this.pipelineService.resetIgnoreChecklist();
                if (value[1].classList.contains('selected')) {
                    const checkReloadStages = (entity, stages?: Stage[]) => {
                        this.selectedEntities.splice(this.selectedEntities.indexOf(entity), 1);
                        if (!this.getSelectedEntities().length)
                            this.reloadStagesInternal(reloadStageList).pipe(
                                finalize(() => {
                                    if (stages && stages.length) {
                                        stages.forEach((stage: Stage) => {
                                            stage.isLoading = false;
                                        });
                                    }
                                })
                            ).subscribe(() => this.detectChanges());
                    };
                    this.getSelectedEntities().forEach(entity => {
                        let oldStage = this.stages.find(stage => stage.id == entity.StageId);
                        if (oldStage.isFinal) {
                            return checkReloadStages(entity, [oldStage]);
                        }

                        if (entity) {
                            entity.SortOrder = newSortOrder;
                            this.updateEntityStage(entity, newStage, oldStage, (cancelled: boolean) => {
                                entity.selected = false;
                                if (cancelled) {
                                    newStage.isLoading =
                                    oldStage.isLoading = false;
                                    this.detectChanges();
                                } else {
                                    this.onEntityStageChanged && this.onEntityStageChanged.emit(entity);
                                    let entities = oldStage.entities,
                                        itemIndex = entities.indexOf(entity);
                                    if (entity.Id != entityId && itemIndex >= 0)
                                        entities.splice(itemIndex, 1);
                                    reloadStageList.push(oldStage.stageIndex);
                                    checkReloadStages(entity, [oldStage]);
                                }
                            }, true);
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
                        (cancelled: boolean) => {
                            if (cancelled) {
                                stage.isLoading =
                                newStage.isLoading = false;
                                this.detectChanges();
                            } else {
                                this.reloadStagesInternal([stage.stageIndex, newStage.stageIndex]).pipe(
                                    finalize(() => stage.isLoading = false)
                                ).subscribe(() => this.detectChanges());
                                this.onEntityStageChanged && this.onEntityStageChanged
                                    .emit(this.getEntityById(entityId, newStage));
                            }
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
        this.subscribers.push(
            this.pipelineService.compactView$.pipe(takeUntil(this.destroy$)).subscribe((compactView: boolean) => {
                this.compactView = compactView;
                this.stagePageCount = compactView ? this.COMPACT_VIEW_PAGE_COUNT : this.DEFAULT_PAGE_COUNT;
                this.detectChanges();
            })
        );
        this.subscribers.push(
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
            ).subscribe()
        );
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

    clearStageDataSources() {
        this._dataSources = {};
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
        const entities$ = this.loadStagesEntities(page, stageIndex, oneStageOnly, false);
        entities$.subscribe((result) => {
            this.stageId = undefined;
            if (result && this.totalsURI && !oneStageOnly)
                this.processTotalsRequest(this.queryWithSearch);
        });
        return entities$;
    }

    private loadStagesEntities(page = 0, stageIndex?: number, oneStageOnly = false, skipTotalRequest = false): Observable<any> {
        let response = of([]),
            index = stageIndex || 0,
            stages: Stage[] = this.stages || [],
            stage: Stage = stages[index];

        if (!stage)
            return response;

        let dataSource = this._dataSources[stage.name],
            contextKey = this._dataSource.uri + stage.id;
        if (this.checkFilterExcludeCondition(stage.id)) {
            this.odataService.cancelDataSource(dataSource, contextKey);
            stage.entities = [];
        } else {
            stage.isLoading = true;
            let filter = { StageId: stage.id };

            if (!dataSource)
                dataSource = this._dataSources[stage.name] = this.getDataSourceForStage(stage);

            if (!isNaN(stage.lastStageIndex) && page)
                filter['SortOrder'] = { lt: new oDataUtils.EdmLiteral(stage.lastStageIndex + 'd') };
            dataSource.pageSize(Math.max(!page && stage.entities
                && stage.entities.length || 0, this.stagePageCount));
            dataSource.sort([
                { getter: 'SortOrder', desc: true },
                { getter: 'Id', desc: true }
            ]);
            const odataUrl = this.getODataUrl(
                this._dataSource.uri,
                this.queryWithSearch.filter(item => {
                    return !item.hasOwnProperty('or') || item.or.every(filter =>
                        typeof(filter) != 'string' || !filter.includes(stage.id.toString())
                    );
                }).concat({and: [extend(filter, this._dataSource.customFilter)]}),
                null,
                this.params
            );
            if (!this.odataService.requestLengthIsValid(odataUrl)) {
                this.message.error(this.l('QueryStringIsTooLong'));
                stage.isLoading = false;
                this.detectChanges();
            } else {
                response = from(this.odataService.loadDataSource(
                    dataSource,
                    contextKey,
                    odataUrl
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
            }
            response.subscribe(
                () => {
                    stage.isLoading = false;
                    this.detectChanges();
                },
                (error) => {
                    stage.isLoading = false;
                    if (error != 'canceled')
                        this.message.error(error);
                }
            );
            this.detectChanges();
        }

        if (!oneStageOnly && stages[index + 1])
            response = this.loadStagesEntities(page, index + 1, false, false);
        return response;
    }

    private getTotalsRequestUrl(filter) {
        let filters = filter;
        let customFilter = this._dataSource && this._dataSource.customFilter;
        if (customFilter)
            filters = filters.concat({ and: [customFilter] });

        return this.getODataUrl(
            this.totalsURI,
            filters,
            null,
            this.params
        );
    }

    private processTotalsRequest(filter?: any) {
        if (!this._totalDataSource) {
            this._totalDataSource = new DataSource({
                requireTotalCount: false,
                store: new ODataStore({
                    url: this.getTotalsRequestUrl(filter),
                    version: AppConsts.ODataVersion,
                    beforeSend: this.getBeforeSendEvent()
                })
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
                        const columnWidthsCache = this.cacheService.get(this.getColumnWidthsCacheKey());
                        stages && this.stages.forEach((stage) => {
                            stage.total = stages[stage.id] ? stages[stage.id].count || stages[stage.id] : 0;
                            stage.isFull = stage.total <= stage.entities.length;
                            stage.width = columnWidthsCache && columnWidthsCache[stage.id]
                                ? columnWidthsCache[stage.id]
                                : (stage.sortOrder === 0 ? StageWidth.Wide : StageWidth.Medium);
                            this._dataSources[stage.name]['total'] = stage.total;
                            this.allStagesEntitiesTotal += stage.total;
                            this.detectChanges();
                        });
                        this.onTotalChange.emit(this.allStagesEntitiesTotal);
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
        let config = cloneDeep(this._dataSource);
        config.store.beforeSend = this.getBeforeSendEvent(stage.id);

        return new DataSource(extend(config, {
            onLoadError: (error) => { this.httpInterceptor.handleError(error); },
            requireTotalCount: !this.totalsURI,
            select: this.selectFields.concat(['SortOrder',
                this.isChecklistAllowed ? 'StageChecklistPointDoneCount' : null
            ].filter(Boolean))
        }));
    }

    private get internalMoveDisabled() {
        return this.stages && this.stages.some((stage: Stage) => stage.isLoading);
    }

    processODataFilter(
        grid,
        uri: string,
        filters: FilterModel[],
        getCheckCustom,
        instanceData: InstanceModel = null,
        params: Param[] = null
    ): Observable<string> {
        filters = this.odataService.processFilters(filters, getCheckCustom);
        const requestValuesWithSearch$ = this.odataService.getODataRequestValues(filters).pipe(
            map((requestValues: ODataRequestValues) => {
                return requestValues
                    ? ({
                        filter: requestValues.filter.concat(this.getSearchFilter()),
                        params: requestValues.params
                    })
                    : null;
            })
        );
        requestValuesWithSearch$.subscribe((requestValues: ODataRequestValues) => {
            if (requestValues) {
                this.queryWithSearch = requestValues.filter;
                this.params = [ ...(params || []), ...requestValues.params ];
                this.loadData(0, null, false);
            }
        });
        return requestValuesWithSearch$.pipe(
            map((requestValues) => requestValues ? requestValues.filter : null)
        );
    }

    loadMore(stageIndex): Observable<any> {
        return this.loadData(
            Math.floor(this.stages[stageIndex].entities.length / this.stagePageCount),
            stageIndex,
            true
        );
    }

    private reloadStagesInternal(stageIndexList: number[]): Observable<any> {
        return forkJoin.apply(this,
            stageIndexList.filter((val, index) => stageIndexList.indexOf(val) == index)
                .map(stageIndex => this.loadData(0, stageIndex, true))
        );
    }

    private updateEntityStage(entity, newStage: Stage, oldStage: Stage, complete = null, forced: boolean = false) {
        if (entity && entity.Id) {
            setTimeout(() => {
                newStage.isLoading = oldStage.isLoading = true;
                if (newStage.name != oldStage.name) {
                    this.pipelineService.updateEntityStage(
                        entity, oldStage, newStage, complete, forced
                    );
                } else
                    this.pipelineService.updateEntitySortOrder(this.pipeline.id, entity, complete);
                this.detectChanges();
            });
        }
    }

    private destroyPipeline() {
        this.dragulaService.destroy(this.dragulaName);
        this.subscribers.forEach((sub) => sub.unsubscribe());
        this.subscribers = [];
    }

    deactivate() {
        this.dialog.closeAll();
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
        return this.getStageSelectedEntities(stage).length;
    }

    private getStageSelectedEntities(stage) {
        return stage.entities.filter(entity => entity && entity.selected);
    }

    allEntitiesAreSelected(stage): boolean {
        return stage.entities.every(entity => entity && entity.selected);
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
                newStageName: stage.name,
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
                    if (result && result.newStageName && result.newStageName != stage.name) {
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
                        });
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

    moveStage(stage: Stage, reverse = false) {
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
        return !this.isConfigureAllowed || !stage.sortOrder || stage.isFinal ||
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
        let topPosition = '123px',
            titleElm = document.querySelector('.column-title');
        if (stage && stage.entities && stage.entities.length && titleElm) {
            topPosition = (window.innerHeight - titleElm.getBoundingClientRect().top) / 2 - 30 + 'px';
        }
        return topPosition;
    }

    getColumnWidthsCacheKey(): string {
        return this.cacheHelper.getCacheKey(
            this.COLUMN_WIDTHS_CACHE_KEY,
            this.pipelinePurposeId + ( this.contactGroupId ? '_' + this.contactGroupId : '')
        );
    }

    changeWidth(stage: Stage, direction: -1 | 1) {
        const stageWidths = this.stageColumnWidths.filter(key => !isNaN(+key));
        const currentWidthIndex = stageWidths.indexOf(stage.width.toString());
        stage.width = currentWidthIndex + direction + 1;
        let stagesWidths = {};
        this.stages.forEach((stage: Stage) => {
            stagesWidths[stage.id] = stage.width;
        });
        const cacheKey = this.getColumnWidthsCacheKey();
        this.cacheService.set(
            cacheKey,
            stagesWidths
        );
        setTimeout(() => this.changeDetector.detectChanges());
    }

    showChecklistConfigDialog(stage) {
        this.dialog.closeAll();
        this.currentTooltip.hide();
        this.dialog.open(CheckListDialogComponent, {
            panelClass: ['slider'],
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                stage: stage,
                pipelinePurposeId: this.pipelinePurposeId,
                contactGroupId: this.contactGroupId
            }
        }).afterClosed().subscribe(() => {
            this.stages.some(item => {
                if (item.id == stage.id) {
                    item.checklistPoints = stage.checklistPoints;
                    this.detectChanges();
                    return true;
                }
            });
        });
    }

    showChecklistEntityDialog(event, entity) {
        this.dialog.closeAll();
        this.dialog.open(EntityCheckListDialogComponent, {
            panelClass: ['slider'],
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                entity: entity,
                pipelinePurposeId: this.pipelinePurposeId,
                contactGroupId: this.contactGroupId
            }
        }).afterClosed().subscribe(isUpdated => {
            if (isUpdated)
                this.refresh(entity.StageId);
        });

        event.stopPropagation();
        this.hideStageHighlighting();
    }

    toggleActionsMenu(event, entity) {
        event.stopPropagation();
        ActionMenuService.prepareActionMenuGroups(this.actionMenuGroups, entity);
        this.actionEvent = entity;
    }

    onMenuItemClick(event) {
        event.itemData.action(this.actionEvent);
        this.actionEvent = null;
        this.detectChanges();
    }
}
