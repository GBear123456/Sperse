/** Core imports */
import { Component, Injector, EventEmitter, HostBinding, Output, Input, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { Store } from '@ngrx/store';
import DataSource from 'devextreme/data/data_source';
import { Observable, Subject, from, of } from 'rxjs';
import { finalize, delayWhen, map, mergeMap } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';
import * as moment from 'moment';
import * as _ from 'lodash';

/** Application imports */
import { CrmStore, PipelinesStoreActions } from '@app/crm/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    PipelineDto,
    StageDto,
    StageServiceProxy,
    CreateStageInput,
    RenameStageInput,
    MergeLeadStagesInput
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { PipelineService } from './pipeline.service';
import { AddRenameMergeDialogComponent } from './add-rename-merge-dialog/add-rename-merge-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import dxTooltip from 'devextreme/ui/tooltip';

@Component({
    selector: 'app-pipeline',
    templateUrl: './pipeline.component.html',
    styleUrls: ['./pipeline.component.less'],
    providers: [ StageServiceProxy ],
    host: {
        '(window:keyup)': 'onKeyUp($event)'
    }
})
export class PipelineComponent extends AppComponentBase implements OnInit, OnDestroy {
    @HostBinding('class.disabled') public disabled = false;
    @Output() onStagesLoaded: EventEmitter<any> = new EventEmitter<any>();
    @Output() onCardClick: EventEmitter<any> = new EventEmitter<any>();

    private _selectedEntities: any;
    private _dataSource: any;
    private _dataSources: any = {};
    private refreshTimeout: any;
    private shiftStartEntity: any;
    private firstStage: any;
    private lastStage: any;
    private quiet: boolean;
    private stageId: number;
    private dataSource$: Subject<DataSource> = new Subject<DataSource>();

    createStageInput: CreateStageInput = new CreateStageInput();
    renameStageInput: RenameStageInput = new RenameStageInput();
    mergeLeadStagesInput: MergeLeadStagesInput = new MergeLeadStagesInput();
    currentTooltip: dxTooltip;

    @Output() selectedEntitiesChange = new EventEmitter<any>();
    @Input() get selectedEntities() {
        return this._selectedEntities || [];
    }
    set selectedEntities(entities) {
        this._selectedEntities = entities;
        this.selectedEntitiesChange.emit(this._selectedEntities);
    }

    @Input() lockMarginalEntities = false;
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

    pipeline: PipelineDto;
    stages: StageDto[];

    private queryWithSearch: any = [];
    private readonly STAGE_PAGE_COUNT = 5;
    private subscribers = [];

    constructor(injector: Injector,
        private _dragulaService: DragulaService,
        private _pipelineService: PipelineService,
        private _stageServiceProxy: StageServiceProxy,
        private store$: Store<CrmStore.State>,
        public dialog: MatDialog
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.startLoading();
        this.subscribers.push(this._dragulaService.drop.subscribe((value) => {
            if (value[0] == this.dragulaName) {
                let entityId = this.getAccessKey(value[1]),
                    newStage = this.getStageByElement(value[2]);
                if (value[1].classList.contains('selected')) {
                    this.getSelectedEntities().forEach((entity) => {
                        let oldStage = _.find(this.stages, (stage) => {
                            return stage.id == entity.StageId;
                        });

                        if ([this.firstStage.id, this.lastStage.id].indexOf(oldStage.id) >= 0)
                            return false;

                        if (entity && oldStage.name != newStage.name)
                            this.updateEntityStage(entity.Id, newStage.name, oldStage.name, () => {
                                if (entity.Id != entityId) {
                                    newStage['entities'].unshift(entity);
                                    oldStage['entities'].splice(oldStage['entities'].indexOf(entity), 1);
                                }
                            });
                    });
                    this.selectedEntities = [];
                } else
                    this.updateEntityStage(entityId, newStage.name,
                        this.getStageByElement(value[3]).name);
            }
        }));
        this.subscribers.push(
            this._dragulaService.dragend.subscribe((value) => {
                    if (value[0] == this.dragulaName)
                        this.hideStageHighlighting();
                }
            )
        );
        this.subscribers.push(
            this._pipelineService.getPipelineDefinitionObservable(this.pipelinePurposeId).pipe(
                map((pipeline) => {
                    return this._dataSource ?
                        of(pipeline) :
                        of(pipeline).pipe(delayWhen(() => {
                            return this.dataSource$;
                        }));
                }),
                mergeMap(pipeline => pipeline)
            ).subscribe((pipeline: PipelineDto) => {
                this.pipeline = pipeline;
                this.createStageInput.pipelineId = this.pipeline.id;
                this.mergeLeadStagesInput.pipelineId = this.pipeline.id;
                if (!this.stages && !this.quiet)
                    this.onStagesLoaded.emit(pipeline);

                this.stages = pipeline.stages.map((stage) => {
                    _.extend(stage, {
                        entities: [],
                        full: true
                    });
                    return stage;
                });

                this.firstStage = this.lockMarginalEntities ? this.stages[0] : {};
                this.lastStage = this.lockMarginalEntities ? this.stages[this.stages.length - 1] : {};

                this.loadStagesEntities(0, this.stageId && _.findIndex(this.stages,  obj => obj.id == this.stageId), Boolean(this.stageId));

                this.refreshTimeout = null;
            })
        );
        const bag: any = this._dragulaService.find(this.dragulaName);
        if (bag !== undefined ) this._dragulaService.destroy(this.dragulaName);
        this._dragulaService.setOptions(this.dragulaName, {
            revertOnSpill: true,
            copySortSource: false,
            ignoreInputTextSelection: false,
            moves: (el, source) => {
                let stage = this.getStageByElement(source);
                if (stage.id == this.firstStage.id || stage.id == this.lastStage.id)
                    return false;

                if (el.classList.contains('selected')) {
                    let cards = this.getSelectedCards();
                    if (cards.length)
                        el.setAttribute('count', [].filter.call(cards, (card) => {
                            return [this.firstStage.id, this.lastStage.id]
                                .indexOf(card.getAttribute('stage')) < 0;
                        }).length);
                }

                setTimeout(() => {
                    if (stage)
                        stage.accessibleActions.forEach((action) => {
                            if (action.targetStageId) {
                                let target = _.find(this.stages, (stage) => {
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

    }

    refresh(quiet = false, stageId?: number, skipAlreadyLoadedChecking = false) {
        this.selectedEntities = [];
        this.quiet = quiet;
        this.stageId = stageId;
        if (!this.refreshTimeout) {
            !this.quiet && this.startLoading();
            this.refreshTimeout = setTimeout(() => {
                if (this.pipeline) {
                    this.loadStagesEntities(0, stageId &&
                        _.findIndex(this.stages, obj => obj.id == stageId), Boolean(stageId));
                    this.refreshTimeout = null;
                } else
                    this.store$.dispatch(new PipelinesStoreActions
                        .LoadRequestAction(skipAlreadyLoadedChecking));
            });
        }
    }

    getEntityByElement(el, stage) {
        return stage && _.find(stage.entities, (entity) => {
            return entity && (entity['Id'] == parseInt(this.getAccessKey(el.closest('.card'))));
        });
    }

    getStageByElement(el) {
        return _.find(this.stages, (stage) => {
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

    loadStagesEntities(page = 0, stageIndex?: number, oneStageOnly = false): Observable<any> {
        let response = of(null);
        let index = stageIndex || 0,
            stages = this.stages, stage = stages[index],
            dataSource = this._dataSources[stage.name],
            filter = {StageId: stage.id};

        if (this.checkFilterExcludeCondition(stage.id))
            stage['entities'] = [];
        else {
            if (!dataSource)
                dataSource = this._dataSources[stage.name] =
                    new DataSource(_.extend(_.clone(this._dataSource), {
                        onLoadError: (error) => { this.httpInterceptor.handleError(error); },
                        requireTotalCount: !this.totalsURI,
                        select: this.selectFields
                    }));

            if (!isNaN(stage['lastEntityId']) && page)
                filter['Id'] = {lt: stage['lastEntityId']};

            dataSource.pageSize(this.STAGE_PAGE_COUNT);
            dataSource['_store']['_url'] =
                this.getODataUrl(this._dataSource.uri,
                    this.queryWithSearch.concat({and: [
                        _.extend(filter, this._dataSource.customFilter)
                    ]})
            );
            dataSource.sort({getter: 'Id', desc: true});
            response = from(dataSource.load()).pipe(
                finalize(() => {
                    let allStagesLoaded = this.isAllStagesLoaded();
                    if (oneStageOnly || allStagesLoaded)
                        setTimeout(() => this.finishLoading(), 1000);
                    if (this.totalsURI && allStagesLoaded)
                        this.processTotalsRequest(this.queryWithSearch);
                }),
                map((entities: any) => {
                    if (entities.length) {
                        stage['entities'] = (page && oneStageOnly ? _.uniqBy(
                            (stage['entities'] || []).concat(entities), (entity) => entity['Id']) : entities).map((entity) => {
                            stage['lastEntityId'] = Math.min((page ? stage['lastEntityId'] : undefined) || Infinity, entity['Id']);
                            return entity;
                        });
                        if (!this.totalsURI)
                            stage['total'] = dataSource.totalCount();
                        stage['full'] = (stage['entities'].length >= (stage['total'] || 0));
                    } else  {
                        if (!page || !stage['entities'])
                            stage['entities'] = [];
                        stage['total'] = stage['entities'].length;
                        stage['full'] = true;
                    }

                    dataSource['entities'] = stage['leads'];
                    dataSource['total'] = stage['total'];
                    return entities;
                })
            );
            response.subscribe(() => {}, (e) => {
                this.message.error(e);
            });
        }

        if (!oneStageOnly && stages[index + 1])
            response = this.loadStagesEntities(page, index + 1);
        return response;
    }

    processTotalsRequest(filter?: any) {
        (new DataSource({
            requireTotalCount: false,
            store: {
                type: 'odata',
                url: this.getODataUrl(this.totalsURI, filter),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                },
                paginate: false
            }
        })).load().done((res) => {
            let stages = res.pop();
            stages && this.stages.forEach((stage) => {
                stage['total'] = stages[stage.id] || 0;
                stage['full'] = stage['total']
                    <= stage['entities'].length;
            });
        });
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
        this.loadStagesEntities();

        return this.queryWithSearch;
    }

    loadMore(stageIndex): Observable<any> {
        this.startLoading();
        return this.loadStagesEntities(
            Math.floor(this.stages[stageIndex]['entities'].length / this.STAGE_PAGE_COUNT),
            stageIndex,
            true
        );
    }

    updateEntityStage(entityId, newStage, oldStage, complete = null) {
        if (entityId && newStage != oldStage) {
            this.disabled = true;
            this._pipelineService.updateEntityStageById(
                this.pipelinePurposeId, entityId, oldStage, newStage, () => {
                    this.stages.every((stage, index) => {
                        let result = (stage.name == oldStage);
                        if (result && stage['total'] && !stage['entities'].length) {
                            this.startLoading();
                            this.loadStagesEntities(0, index, true);
                        }
                        return !result;
                    });
                    this.disabled = false;
                    complete && complete();
                }
            );
        }
    }

    ngOnDestroy() {
        this._dragulaService.destroy(this.dragulaName);
        this.subscribers.forEach((sub) => sub.unsubscribe());
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
        return [].map.call(this.getSelectedCards(), (card) => {
            return !card.classList.contains('gu-mirror') &&
                this.getEntityByElement(card, this.getStageByElement(card));
        }).filter(Boolean);
    }

    private setCardSelection(card, selectedValue) {
        let method = selectedValue ? 'add' : 'remove';
        card.classList[method]('selected');
        let checkBoxElm = card.getElementsByTagName('dx-check-box')[0];
        if (checkBoxElm)
            checkBoxElm.classList[method]('dx-checkbox-checked');
    }

    private highlightSelectedCard(event) {
        let card;
        (event.path || event.composedPath()).every((elm) => {
            let isCard = elm.classList.contains('card');
            if (isCard) {
                card = elm;
                this.setCardSelection(card, !elm.classList.contains('selected'));
            }
            return !isCard;
        });
        return card && card.classList
            .contains('selected');
    }

    private toogleHighlightShiftArea(entity, checked) {
        if (this.shiftStartEntity &&
            this.shiftStartEntity.StageId == entity.StageId
        ) {
            let startCard: any = document.querySelector('[accessKey="' + this.shiftStartEntity.Id + '"]'),
                endCard: any = document.querySelector('[accessKey="' + entity.Id + '"]');

            if (startCard.offsetTop > endCard.offsetTop) {
                let stored = startCard;
                startCard = endCard;
                endCard = stored;
            }

            while (startCard != endCard) {
                if (startCard.nodeType == Node.ELEMENT_NODE)
                    this.setCardSelection(startCard, checked);
                startCard = startCard.nextSibling;
            }
            this.setCardSelection(endCard, checked);
        } else
            this.shiftStartEntity = entity;
    }

    deselectAllCards() {
        let elements = this.getSelectedCards();
        while (elements.length) {
            this.setCardSelection(elements[0], false);
        }
    }

    onKeyUp(event) {
        if (event.keyCode == 16/*SHIFT*/)
            this.shiftStartEntity = null;
    }

    onCardClickInternal(entity, event) {
        let clickedOnCheckbox = event.target.classList.contains('dx-checkbox-icon');
        if (event.ctrlKey || event.shiftKey || clickedOnCheckbox) {
            let checkedCard = this.highlightSelectedCard(event);
            if (!checkedCard && event.ctrlKey && event.shiftKey)
                this.deselectAllCards();
            else if (event.shiftKey)
                this.toogleHighlightShiftArea(entity, checkedCard);
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
    }

    updateStage(data, actionType) {
        this.currentTooltip.hide();
        this.createStageInput.sortOrder = data.sortOrder != 0 ? data.sortOrder : data.sortOrder + 1;
        this.mergeLeadStagesInput.sourceStageId = this.renameStageInput.id = data.id;
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
                        this.mergeLeadStagesInput.destinationStageId = result.moveToStage;
                        this._stageServiceProxy.mergeStages(this.mergeLeadStagesInput).subscribe(() => {
                                this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                            }
                        );
                    } else if (result && !result.moveToStage) {
                        this._stageServiceProxy.mergeStages(this.mergeLeadStagesInput).subscribe(() => {
                            this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(true));
                        });
                    }
                    break;
                default:
                    break;
            }

        });
    }
}
