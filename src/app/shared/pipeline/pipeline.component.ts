 import { Component, Injector, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';

import { PipelineDto, PipelineData, ProcessLeadInput,
    LeadServiceProxy, CancelLeadInfo, UpdateLeadStageInfo } from '@shared/service-proxies/service-proxies';

import { AppConsts } from '@shared/AppConsts';
import { PipelineService } from './pipeline.service';
import { DragulaService } from 'ng2-dragula';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import DataSource from 'devextreme/data/data_source';

@Component({
    selector: 'app-pipeline',
    templateUrl: './pipeline.component.html',
    styleUrls: ['./pipeline.component.less'],
    providers: [PipelineService]
})
export class PipelineComponent extends AppComponentBase implements OnInit, OnDestroy {
    @Output() onStagesLoaded: EventEmitter<any> = new EventEmitter<any>();

    @Input() dataSource: DataSource;
    @Input() pipelinePurposeId: string;
    pipeline: PipelineDto;
    stages: any = [];
    leadDetailQueryParams;
    dragulaName = 'stage';

    private queryWithSearch: any = [];
    private readonly STAGE_PAGE_COUNT = 5;
    private readonly dataSourceURI = 'Lead';

    constructor(injector: Injector,
        private _leadService: LeadServiceProxy,
        private _dragulaService: DragulaService,
        private _pipelineService: PipelineService,
        private _router: Router
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        _dragulaService.drop.subscribe((value) => {
            let leadId = this.getAccessKey(value[1]),
                newStage = this.getAccessKey(value[2]),
                oldStage = this.getAccessKey(value[3]);
            if (leadId && newStage != oldStage)
                _pipelineService.updateLeadStageByLeadId(leadId, oldStage, newStage);
        });
        _dragulaService.dragend.subscribe((value) => {
            [].forEach.call(document.querySelectorAll('.drop-area'), (el) => {
                el.classList.remove('drop-area');
            });
        });
        _dragulaService.setOptions(this.dragulaName, {
            ignoreInputTextSelection: false,
            moves: (el, source) => {
                let stage = this.getStageByElement(source);
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
                    return lead && !lead.locked && !stage.accessibleActions.every((action) => {
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
        this.leadDetailQueryParams = this._router.url;
    }

    ngOnInit(): void {
        this.refresh();
    }

    refresh() {
        this.startLoading(true);
        this._pipelineService
            .getPipelineDefinitionObservable(this.pipelinePurposeId)
            .subscribe((result: PipelineDto) => {
                this.pipeline = result;
                this.onStagesLoaded.emit(result.stages);
                this.loadStagesLeads();
            });
    }

    getLeadByElement(el, stage) {
        return stage && _.find(stage.leads, (lead) => {
            return lead && (lead.Id == parseInt(this.getAccessKey(el.closest('.card'))));
        });
    }

    getStageByElement(el) {
        return _.find(this.stages, (stage) => {
            return stage && (stage.name == this.getAccessKey(el.closest('.column-items')));
        });
    }

    getAccessKey(elm) {
        return elm && elm.getAttribute('accessKey');
    }

    loadStagesLeads(index = 0, page = 0, oneStageOnly = false) {
        let stages = this.pipeline.stages;
        this.dataSource.pageSize(this.STAGE_PAGE_COUNT);
        this.dataSource['_store']['_url'] =
            this.getODataURL(this.dataSourceURI,
                this.queryWithSearch.concat({or: [{Stage: stages[index].name}]}));
        this.dataSource.sort({getter: 'CreationTime', desc: true});
        this.dataSource.pageIndex(page);
        this.dataSource.load().then((leads) => {
            stages[index]['leads'] = oneStageOnly ? _.uniqBy(
                (stages[index]['leads'] || []).concat(leads), (lead) => lead['Id']) : leads;
            stages[index]['total'] = this.dataSource.totalCount();
            if (!oneStageOnly && this.pipeline.stages[++index])
                this.loadStagesLeads(index, page);
            else {
                this.stages = stages;
                this.finishLoading(true);
            }
        });
    }

    advancedODataFilter(grid: any, uri: string, query: any[]) {
        this.queryWithSearch = query.concat(this.getSearchFilter());

        this.startLoading(true);
        this.loadStagesLeads();
        return this.queryWithSearch;
    }

    loadMore(stageIndex) {
        this.startLoading(true);
        this.loadStagesLeads(stageIndex,
            Math.floor(this.stages[stageIndex].leads.length
                / this.STAGE_PAGE_COUNT), true);
    }

    ngOnDestroy() {
        this._dragulaService.destroy(this.dragulaName);
    }
}
