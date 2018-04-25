import {Component, Injector, Input, OnInit, AfterViewInit} from '@angular/core';
import {AppComponentBase} from '@shared/common/app-component-base';
import { PipelineDto, PipelineServiceProxy, PipelineData } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

import { DragulaService } from 'ng2-dragula';

import * as _ from 'underscore';

import DataSource from 'devextreme/data/data_source';

@Component({
    selector: 'app-pipeline',
    templateUrl: './pipeline.component.html',
    styleUrls: ['./pipeline.component.less'],
    providers: [PipelineServiceProxy]
})
export class PipelineComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @Input() dataSource: DataSource;
    @Input() pipelinePurposeId: string;
    pipeline: PipelineDto;
    stages: any = [];

    constructor(injector: Injector,
        private _pipelineService: PipelineServiceProxy,
        private _dragulaService: DragulaService
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        _dragulaService.drop.subscribe((value) => {
            let leadId = this.getAccessKey(value[1]),
                newStage = this.getAccessKey(value[2]),
                oldStage = this.getAccessKey(value[3]);
            if (newStage != oldStage)
                this.updateLeadStage(leadId, newStage);
            document.querySelectorAll('.drop-area').forEach((el) => {
                el.classList.remove('drop-area');
            })
        });
        _dragulaService.setOptions('stage', {
            moves: (el, source) => {
              let stage = this.getStageByElement(source);
              if (stage)
                  stage.accessibleActions.forEach((action) => {
                      if (action.targetStageId) {
                          let target = _.findWhere(this.stages, {id: action.targetStageId}),
                              targetElm = document.querySelector('[accessKey="' + target.name + '"]');
                          targetElm && targetElm.classList.add('drop-area');
                      }
                  });
              return true; // elements are always draggable by default
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
            },
            invalid: (el) => {
              let stage = this.getStageByElement(el);
              if (stage && stage.accessibleActions.length)
                  return stage.accessibleActions.every((action) => { 
                      return !action.targetStageId;
                  });
              else
                  return true; // prevent any drags from initiating by default
            }
        });
    }

    ngOnInit(): void {
        this.startLoading(true);
        this._pipelineService
            .getPipelinesData(this.pipelinePurposeId)
            .subscribe((result: PipelineData[]) => {
                if (result.length > 0)
                {
                    this.getPipelineDefinition(result[0].id);
                }
        });
    }

    ngAfterViewInit(): void {
    }

    updateLeadStage(leadId, newStage) {
    }

    getStageByElement(el) {
        return _.findWhere(this.stages, {name: 
            this.getAccessKey(el.closest('.column-items'))});
    }

    getAccessKey(elm) {
        return elm && elm.getAttribute('accessKey');
    }

    getPipelineDefinition(pipelineId: number): void {        
        this._pipelineService
            .getPipelineDefinition(pipelineId)
            .subscribe(result => {
                result.stages.sort((a, b) => {
                    return a.sortOrder > b.sortOrder ? 1: -1;
                }).forEach((item) => {
                    item['index'] = Math.abs(item.sortOrder);
                    item['dragAllowed'] = !item.accessibleActions.every((action) => {
                        return !action.targetStageId;
                    });
                });
                this.pipeline = result;
                this.loadStagesLeads(0);
            });
    }

    loadStagesLeads(index) {
        let stages = this.pipeline.stages;
        this.dataSource.pageSize(5);
        this.dataSource.filter(['Stage', '=', this.pipeline.stages[index].name]);
        this.dataSource.sort({getter: 'CreationTime', desc: true});
        this.dataSource.load().then((leads) => {
            if (leads.length) {
                stages[index]['leads'] = 
                    (stages[index]['leads'] || []).concat(leads);
                stages[index]['total'] = 
                    (stages[index]['total'] || 0) +
                    this.dataSource.totalCount();
            }
            if (this.pipeline.stages[++index])
                this.loadStagesLeads(index);
            else {
                this.stages = this.pipeline.stages;
                this.finishLoading(true);
            }
        });

    }

    loadMore() {
        this.startLoading(true);
        this.dataSource.pageIndex(
            this.dataSource.pageIndex() + 1);
        this.loadStagesLeads(0);
    }
}