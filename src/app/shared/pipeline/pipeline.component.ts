import { Component, Injector, EventEmitter, HostBinding, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { PipelineDto, LeadServiceProxy, StageDto } from '@shared/service-proxies/service-proxies';

import { AppConsts } from '@shared/AppConsts';
import { PipelineService } from './pipeline.service';
import { DragulaService } from 'ng2-dragula';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';

import DataSource from 'devextreme/data/data_source';

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

    private _selectedLeads: any;
    private _dataSource: DataSource;
    private loadStageIndex: number;
    private refreshTimeout: any;
    private shiftStartLead: any;
    private firstStage: any;
    private lastStage: any;
    
    @Output() selectedLeadsChange = new EventEmitter<any>();    
    @Input() 
    get selectedLeads() {
        return this._selectedLeads || [];
    }
    set selectedLeads(leads) {
        this._selectedLeads = leads;
        this.selectedLeadsChange.emit(this._selectedLeads);
    }
    
    @Input('dataSource')
    set dataSource(dataSource: DataSource) {
        this._dataSource = dataSource;
        if (this._dataSource)
            this.refresh();
    }
    @Input() pipelinePurposeId: string;

    pipeline: PipelineDto;
    stages: StageDto[];
    dragulaName = 'stage';

    private queryWithSearch: any = [];
    private readonly STAGE_PAGE_COUNT = 5;
    private readonly dataSourceURI = 'Lead';
    private subscribers = [];

    constructor(injector: Injector,
        private _leadService: LeadServiceProxy,
        private _dragulaService: DragulaService,
        private _pipelineService: PipelineService,
        private _router: Router
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    refresh(quiet = false, addedNew = false) {
        this.selectedLeads = [];
        if (!this.refreshTimeout) {
            if (!quiet)
                this.startLoading();
            this.refreshTimeout = setTimeout(() => {
                this._pipelineService
                    .getPipelineDefinitionObservable(this.pipelinePurposeId)
                    .subscribe((result: PipelineDto) => {
                        this.pipeline = result;
                        this.onStagesLoaded.emit(result);
                        if (this._dataSource) {
                            this.loadStageIndex = addedNew ? Math.floor(this.stages.length / 2) : 0;
                            this.loadStagesLeads(0, addedNew);
                        }
                        this.refreshTimeout = null;
                    });
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

    loadStagesLeads(page = 0, oneStageOnly = false) {
        let index = this.loadStageIndex, stages = this.pipeline.stages;
        this._dataSource.pageSize(this.STAGE_PAGE_COUNT);
        this._dataSource['_store']['_url'] =
            this.getODataURL(this.dataSourceURI,
                this.queryWithSearch.concat({or: [{StageId: stages[index].id}]}));
        this._dataSource.sort({getter: 'Id', desc: true});
        this._dataSource.pageIndex(page);
        this._dataSource.load().done((leads) => {
            if (index == this.loadStageIndex) {
                let stage = stages[index];
                stage['leads'] = page && oneStageOnly ? _.uniqBy(
                    (stages[index]['leads'] || []).concat(leads), (lead) => lead['Id']) : leads;
                stage['total'] = this._dataSource.totalCount();
                stage['full'] = stage['total'] <= stage['leads'].length;
                if (!oneStageOnly && this.pipeline.stages[++this.loadStageIndex])
                    this.loadStagesLeads(page);
                else {
                    this.stages = stages;
                    this.firstStage = stages[0];
                    this.lastStage = stages[stages.length - 1];
                    this.finishLoading();
                }
            }
        });
    }

    advancedODataFilter(grid: any, uri: string, query: any[]) {
        this.queryWithSearch = query.concat(this.getSearchFilter());
        this.startLoading();

        this.loadStageIndex = 0;
        this.loadStagesLeads();

        return this.queryWithSearch;
    }

    loadMore(stageIndex) {
        this.startLoading();
        this.loadStageIndex = stageIndex;
        this.loadStagesLeads(
            Math.floor(this.stages[stageIndex]['leads'].length
                / this.STAGE_PAGE_COUNT), true);
    }

    updateLeadStage(leadId, newStage, oldStage, complete = null) {
        if (leadId && newStage != oldStage) {
            this.disabled = true;
            this._pipelineService.updateLeadStageByLeadId(
                leadId, oldStage, newStage, () => {
                    this.stages.every((stage, index) => {
                        let result = (stage.name == oldStage);
                        if (result && stage['total'] && !stage['leads'].length) {
                            this.loadStageIndex = index;
                            this.loadStagesLeads(0, true);
                            this.startLoading();
                        }
                        return !result;
                    });
                    this.disabled = false;
                    complete && complete();
                }
            );
        }
    }

    ngOnInit() {
         this.subscribers.push(this._dragulaService.drop.subscribe((value) => {
            let leadId = this.getAccessKey(value[1]),
                newStage = this.getStageByElement(value[2]);
            
            if (value[1].classList.contains('selected')) {
                this.getSelectedLeads().forEach((lead) => {
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
        ));

        this._dragulaService.setOptions(this.dragulaName, {
            ignoreInputTextSelection: false,
            moves: (el, source) => {
                if (el.classList.contains('selected')) {
                    let cards = this.getSelectedCards();
                    if (cards.length)
                        el.setAttribute('count', cards.length);
                }

                let stage = this.getStageByElement(el);
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

                if (stage && stage.accessibleActions.length) {
                    let lead = this.getLeadByElement(el, stage);
                    return lead && !stage.accessibleActions.every((action) => {
                        return !action.targetStageId;
                    });
                } else
                    return false;

            },
            accepts: (el, target, source) => {
                let stageSource = this.getStageByElement(source),
                    stageTarget = this.getStageByElement(target);
                if (stageSource && stageTarget) {
                    return (stageSource.name == stageTarget.name) ||
                        !stageSource.accessibleActions.every((action) => {
                            return action.targetStageId != stageTarget.id;
                        });
                } else
                    return false; // elements can't be dropped in any of the `containers` by default
            }
        });

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

    highlightSelectedCard(event) {
        let card;
        event.path.every((elm) => {
            let isCard = elm.classList.contains('card');
            if (isCard) {
                card = elm;
                let stageName = card.getAttribute('stage');
                if ([this.firstStage.name, this.lastStage.name].indexOf(stageName) < 0)
                    elm.classList.toggle('selected');
            }
            return !isCard;    
        });        
        return card && card.classList
            .contains('selected');
    }

    deselectAllCards() {
        let elements = this.getSelectedCards();
        while(elements.length)
            elements[0].classList.remove('selected');
    }

    checkHighlightShiftArea(lead) {
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
                    startCard.classList.add('selected');
                startCard = startCard.nextSibling;
            } 
            endCard.classList.add('selected');
        } else 
            this.shiftStartLead = lead;
    }

    onKeyUp(event) {
        if (event.keyCode == 16/*SHIFT*/)
            this.shiftStartLead = null;
    }

    onCardClick(lead, event) {
         if (event.ctrlKey || event.shiftKey) {
            let checkedCard = this.highlightSelectedCard(event);
            if (!checkedCard && event.ctrlKey && event.shiftKey)
                this.deselectAllCards();
            else if ((checkedCard || this.shiftStartLead) && event.shiftKey)
                this.checkHighlightShiftArea(lead);
            this.selectedLeads = this.getSelectedLeads();            
         } else
            lead && this._router.navigate(
                ['app/crm/client', lead.CustomerId, 'lead', lead.Id, 'contact-information'], {
                    queryParams: {
                    referrer: 'app/crm/leads',
                    dataLayoutType: DataLayoutType.Pipeline
                }
            });
        this.hideStageHighlighting();
    }
}