/** Core imports */
import { Component, Injector, EventEmitter, HostBinding, Output, Input, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { Store } from '@ngrx/store';
import DataSource from 'devextreme/data/data_source';
import { Subject, of } from 'rxjs';
import { delayWhen, map, mergeMap } from 'rxjs/operators';
import { DragulaService } from 'ng2-dragula';
import * as moment from 'moment';
import * as _ from 'lodash';

/** Application imports */
import { CrmStoreState, PipelinesStoreActions } from '@app/crm/shared/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { PipelineDto, StageDto } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { PipelineService } from './pipeline.service';

@Component({
    selector: 'app-pipeline',
    templateUrl: './pipeline.component.html',
    styleUrls: ['./pipeline.component.less'],
    host: {
        '(window:keyup)': 'onKeyUp($event)'
    }
})
export class PipelineComponent extends AppComponentBase implements OnInit, OnDestroy {
    @HostBinding('class.disabled') public disabled = false;
    @Output() onStagesLoaded: EventEmitter<any> = new EventEmitter<any>();
    @Output() onCardClick: EventEmitter<any> = new EventEmitter<any>();

    private _selectedLeads: any;
    private _dataSource: any;
    private _dataSources: any = {};
    private refreshTimeout: any;
    private shiftStartLead: any;
    private firstStage: any;
    private lastStage: any;
    private quiet: boolean;
    private stageId: number;
    private dataSource$: Subject<DataSource> = new Subject<DataSource>();

    @Output() selectedLeadsChange = new EventEmitter<any>();
    @Input() get selectedLeads() {
        return this._selectedLeads || [];
    }
    set selectedLeads(leads) {
        this._selectedLeads = leads;
        this.selectedLeadsChange.emit(this._selectedLeads);
    }

    @Input() totalsURI: string;
    @Input() selectFields: string[];
    @Input('dataSource')
    set dataSource(dataSource: DataSource) {
        this._dataSource = dataSource;
        if (dataSource) {
            this.refresh(false, undefined, false);
            this.dataSource$.next(dataSource);
        }
    }
    @Input() pipelinePurposeId: string;

    pipeline: PipelineDto;
    stages: StageDto[];
    dragulaName = 'stage';

    private queryWithSearch: any = [];
    private readonly STAGE_PAGE_COUNT = 5;
    private subscribers = [];

    constructor(injector: Injector,
        private _dragulaService: DragulaService,
        private _pipelineService: PipelineService,
        private store$: Store<CrmStoreState.CrmState>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    ngOnInit() {
        this.subscribers.push(this._dragulaService.drop.subscribe((value) => {
            let leadId = this.getAccessKey(value[1]),
                newStage = this.getStageByElement(value[2]);
            if (value[1].classList.contains('selected')) {
                this.getSelectedLeads().forEach((lead) => {
                    if ([this.firstStage.name, this.lastStage.name].indexOf(lead.Stage) >= 0)
                        return false;

                    let oldStage = _.find(this.stages, (stage) => {
                        return stage.name == lead.Stage;
                    });

                    if (lead && lead.Stage != newStage.name)
                        this.updateLeadStage(lead.Id, newStage.name, lead.Stage, () => {
                            if (lead.Id != leadId) {
                                newStage['leads'].unshift(lead);
                                oldStage['leads'].splice(oldStage['leads'].indexOf(lead), 1);
                            }
                        });
                });
                this.selectedLeads = [];
            } else
                this.updateLeadStage(leadId, newStage.name,
                    this.getStageByElement(value[3]).name);

        }));
        this.subscribers.push(
            this._dragulaService.dragend.subscribe((value) => {
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

                if (!this.stages && !this.quiet)
                    this.onStagesLoaded.emit(pipeline);
                
                this.stages = pipeline.stages.map((stage) => {
                    _.extend(stage, {
                        leads: [],
                        full: true
                    });
                    return stage;
                });
                this.firstStage = this.stages[0];
                this.lastStage = this.stages[this.stages.length - 1];
                
                this.loadStagesLeads(0, this.stageId && _.findIndex(this.stages,  obj => obj.id == this.stageId), Boolean(this.stageId));

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
                let stage = this.getStageByElement(el);
                if (stage.id == this.firstStage.id || stage.id == this.lastStage.id)
                    return false;

                if (el.classList.contains('selected')) {
                    let cards = this.getSelectedCards();
                    if (cards.length)
                        el.setAttribute('count', [].filter.call(cards, (card) => {
                            return [this.firstStage.name, this.lastStage.name]
                                .indexOf(card.getAttribute('stage')) < 0;
                        }).length);
                }

                setTimeout(() => {
                    if (stage)
                        stage.accessibleActions.forEach((action) => {
                            if (action.targetStageId) {
                                let target = _.find(this.stages, (stage) => {
                                    return stage.id == action.targetStageId;
                                }), targetElm = document.querySelector('[accessKey="' + target.name + '"]');
                                targetElm && targetElm.classList.add('drop-area');
                            }
                        });
                });

                return stage && this.getLeadByElement(el, stage);
            },
            accepts: (el, target, source) => {
                let stageSource = this.getStageByElement(source),
                    stageTarget = this.getStageByElement(target);
                if (stageSource && stageTarget) {
                    return (stageSource.name != stageTarget.name) &&
                        stageSource.accessibleActions.some((action) => {
                            return action.targetStageId == stageTarget.id;
                        });
                } else
                    return false; // elements can't be dropped in any of the `containers` by default
            }
        });

    }

    refresh(quiet = false, stageId = undefined, skipAlreadyLoadedChecking = true) {
        this.selectedLeads = [];
        this.quiet = quiet;
        this.stageId = stageId;
        if (!this.refreshTimeout) {
            !this.quiet && this.startLoading();
            this.refreshTimeout = setTimeout(() => {
                this.store$.dispatch(new PipelinesStoreActions.LoadRequestAction(skipAlreadyLoadedChecking));
            });
        }
    }

    getLeadByElement(el, stage) {
        return stage && _.find(stage.leads, (lead) => {
            return lead && (lead['Id'] == parseInt(this.getAccessKey(el.closest('.card'))));
        });
    }

    getStageByElement(el) {
        return _.find(this.stages, (stage) => {
            return stage && (stage.name == (el.getAttribute('stage') || this.getAccessKey(el)));
        });
    }

    getAccessKey(elm) {
        return elm && elm.getAttribute('accessKey');
    }

    loadStagesLeads(page = 0, stageIndex = undefined, oneStageOnly = false) {
        let index = stageIndex || 0,
            stages = this.stages, stage = stages[index],
            dataSource = this._dataSources[stage.name];

        if (!dataSource)
            dataSource = this._dataSources[stage.name] =
                new DataSource(_.extend(_.clone(this._dataSource), {
                    requireTotalCount: !this.totalsURI,
                    select: this.selectFields
                }));

        dataSource.pageSize(this.STAGE_PAGE_COUNT);
        dataSource['_store']['_url'] =
            this.getODataUrl(this._dataSource.uri,
                this.queryWithSearch.concat({and: [
                    _.extend({StageId: stage.id}, this._dataSource.customFilter)
                ]}
            )
        );
        dataSource.sort({getter: 'Id', desc: true});
        dataSource.pageIndex(page);
        dataSource.load().done((leads) => {
            stage['leads'] = page && oneStageOnly ? _.uniqBy(
                (stage['leads'] || []).concat(leads), (lead) => lead['Id']) : leads;
            if (oneStageOnly || this.isAllStagesLoaded()) {
                this.totalsURI && this.processTotalsRequest();
                setTimeout(() => this.finishLoading(), 1000);
            }
        });

        if (!oneStageOnly && stages[index + 1])
            this.loadStagesLeads(page, index + 1);
    }

    processTotalsRequest() {
        (new DataSource({
            requireTotalCount: false,
            store: {
                type: 'odata',
                url: this.getODataUrl(this.totalsURI),
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                },
                paginate: false
            }
        })).load().done((res) => { 
            let stages = res.pop();            
            stages && this.stages.forEach((stage) => {
                stage['total'] = stages[stage.id];
                stage['full'] = stage['total'] 
                    <= stage['leads'].length;
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
        this.loadStagesLeads();

        return this.queryWithSearch;
    }

    loadMore(stageIndex) {
        this.startLoading();
        this.loadStagesLeads(
            Math.floor(this.stages[stageIndex]['leads'].length
                / this.STAGE_PAGE_COUNT), stageIndex, true);
    }

    updateLeadStage(leadId, newStage, oldStage, complete = null) {
        if (leadId && newStage != oldStage) {
            this.disabled = true;
            this._pipelineService.updateLeadStageByLeadId(
                leadId, oldStage, newStage, () => {
                    this.stages.every((stage, index) => {
                        let result = (stage.name == oldStage);
                        if (result && stage['total'] && !stage['leads'].length) {
                            this.startLoading();
                            this.loadStagesLeads(0, index, true);
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

    removeTimezoneOffset(utcDateTime) {
        if (utcDateTime)
            return moment(utcDateTime).add(-(new Date(<any>utcDateTime).getTimezoneOffset()), 'minutes');
    }

    hideStageHighlighting() {
        [].forEach.call(document.querySelectorAll('.drop-area'), (el) => {
            el.classList.remove('drop-area');
        });
    }

    getSelectedCards() {
        return document.getElementsByClassName('card selected');
    }

    getSelectedLeads() {
        return [].map.call(this.getSelectedCards(), (card) => {
            return !card.classList.contains('gu-mirror') &&
                this.getLeadByElement(card, this.getStageByElement(card));
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
        event.path.every((elm) => {
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

    private toogleHighlightShiftArea(lead, checked) {
        if (this.shiftStartLead &&
            this.shiftStartLead.Stage == lead.Stage
        ) {
            let startCard: any = document.querySelector('[accessKey="' + this.shiftStartLead.Id + '"]'),
                endCard: any = document.querySelector('[accessKey="' + lead.Id + '"]');

            if (startCard.offsetTop > endCard.offsetTop) {
                let stored = startCard;
                startCard = endCard;
                endCard = stored;
            }

            while(startCard != endCard) {
                if (startCard.nodeType == Node.ELEMENT_NODE)
                    this.setCardSelection(startCard, checked);
                startCard = startCard.nextSibling;
            }
            this.setCardSelection(endCard, checked);
        } else
            this.shiftStartLead = lead;
    }

    deselectAllCards() {
        let elements = this.getSelectedCards();
        while (elements.length){
            this.setCardSelection(elements[0], false);
        }
    }

    onKeyUp(event) {
        if (event.keyCode == 16/*SHIFT*/)
            this.shiftStartLead = null;
    }

    onCardClickInternal(lead, event) {
        let clickedOnCheckbox = event.target.classList.contains('dx-checkbox-icon');
        if (event.ctrlKey || event.shiftKey || clickedOnCheckbox) {
            let checkedCard = this.highlightSelectedCard(event);
            if (!checkedCard && event.ctrlKey && event.shiftKey)
                this.deselectAllCards();
            else if (event.shiftKey)
                this.toogleHighlightShiftArea(lead, checkedCard);
            this.selectedLeads = this.getSelectedLeads();
        } else
            this.onCardClick.emit(lead);
        this.hideStageHighlighting();
    }
}
