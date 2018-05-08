import { Injectable, Injector } from '@angular/core';
import { LeadServiceProxy, CancelLeadInfo, UpdateLeadStageInfo, ProcessLeadInput, PipelineServiceProxy, PipelineDto } from '@shared/service-proxies/service-proxies';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { MatDialog } from '@angular/material';

import { AppConsts } from '@shared/AppConsts';
import { Observable } from "rxjs";
import 'rxjs/add/operator/switchMap';
import * as _ from "underscore";

@Injectable()
export class PipelineService {
    private stages = [];
    private pipeline: PipelineDto;

    constructor(
        injector: Injector,
        private _dialog: MatDialog,
        private _leadService: LeadServiceProxy,
        private _pipelineServiceProxy: PipelineServiceProxy
    ) {  
    }

    getPipelineDefinitionObservable(pipelinePurposeId: string): Observable<PipelineDto> {
        return this._pipelineServiceProxy
            .getPipelinesData(pipelinePurposeId)
            .switchMap(result => {
                let pipelineId = result[0].id;
                if ((!this.pipeline || pipelineId != this.pipeline.id) && result.length > 0)
                    return this._pipelineServiceProxy.getPipelineDefinition(result[0].id)
                        .map(result => {
                            result.stages.sort((a, b) => {
                                return a.sortOrder > b.sortOrder ? 1: -1;
                            }).forEach((item) => {
                                item['index'] = Math.abs(item.sortOrder);
                                item['dragAllowed'] = !item.accessibleActions.every((action) => {
                                    return !action.targetStageId;
                                });
                            });
                            
                            this.pipeline = result; 
                            this.stages = result.stages;
                            
                            return result;
                        });
                else
                    return Observable.of(this.pipeline);
            });
    }

    updateLeadStageByLeadId(leadId, oldStageName, newStageName, complete = null) {
        let fromStage = _.findWhere(this.stages, {name: oldStageName});
        if (fromStage) {
            let lead = _.findWhere(fromStage.leads, {Id: parseInt(leadId)});
            return lead && this.updateLeadStage(lead, oldStageName, newStageName, complete);
        }
    }

    updateLeadStage(lead, oldStageName, newStageName, complete = null) {
        let leadId = lead['Id'] || lead['id'],
            fromStage = _.findWhere(this.stages, {name: oldStageName}),
            toStage = _.findWhere(this.stages, {name: newStageName});
        if (fromStage && toStage) {
            let action = _.findWhere(fromStage.accessibleActions, {targetStageId: toStage.id});
            if (action && lead && !lead.locked) {
                lead.locked = true;
                if (action.sysId == AppConsts.SYS_ID_CRM_CANCEL_LEAD)
                    this._dialog.open(LeadCancelDialogComponent, {
                        data: { }
                    }).afterClosed().subscribe(result => {
                        if (result) {
                            this._leadService.cancelLead(
                                CancelLeadInfo.fromJS({
                                    leadId: leadId,
                                    cancellationReasonId: result.reasonId,
                                    comment: result.comment
                                })
                            ).finally(() => {
                                lead.locked = false;
                                complete && complete();
                            }).subscribe((result) => { 
                                this.completeLeadUpdate(lead, fromStage, toStage);
                            });
                        } else {
                            this.moveLeadTo(lead, toStage, fromStage);
                            complete && complete();
                        }
                    });
                else if (action.sysId == AppConsts.SYS_ID_CRM_UPDATE_LEAD_STAGE)
                    this._leadService.updateLeadStage(
                        UpdateLeadStageInfo.fromJS({
                            leadId: leadId, 
                            stageId: toStage.id
                        })
                    ).finally(() => {
                        lead.locked = false;
                        complete && complete();
                    }).subscribe((res) => { 
                        this.completeLeadUpdate(lead, fromStage, toStage);
                    });
                else if (action.sysId == AppConsts.SYS_ID_CRM_PROCESS_LEAD)
                   this._leadService.processLead(
                        ProcessLeadInput.fromJS({
                            leadId: leadId
                        })
                    ).finally(() => {
                        lead.locked = false;
                        complete && complete();
                    }).subscribe((res) => { 
                        this.completeLeadUpdate(lead, fromStage, toStage);
                    }); 
                else {
                    lead.locked = false;
                    complete && complete();
                }
            } else {
                this.moveLeadTo(lead, toStage, fromStage);
                complete && complete();
            }
                
            return action;
        } else
            complete && complete();
    }

    moveLeadTo(lead, sourceStage, targetStage) {        
        if (sourceStage.leads && targetStage.leads)
            targetStage.leads.unshift(
                sourceStage.leads.splice(
                    sourceStage.leads.indexOf(lead), 1).pop());
        lead.stage = lead.Stage = targetStage.name;
        lead.locked = false;
    }

    completeLeadUpdate(lead, fromStage, toStage) {
        lead.Stage = toStage.name;
        fromStage.total--;
        toStage.total++;
    }
}