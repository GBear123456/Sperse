import { Injectable, Injector } from '@angular/core';
import { LeadServiceProxy, CancelLeadInfo, UpdateLeadStageInfo, ProcessLeadInput, PipelineServiceProxy, PipelineDto } from '@shared/service-proxies/service-proxies';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { MatDialog } from '@angular/material';

import { Observable } from "rxjs";
import 'rxjs/add/operator/switchMap';
import * as _ from "underscore";

@Injectable()
export class PipelineService {
    private stages = [];

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
                if (result.length > 0)
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
                            this.stages = result.stages;
                            return result;
                        });
                else
                    return Observable.of(null);
            });
    }

    updateLeadStageByLeadId(leadId, oldStageName, newStageName) {
        let fromStage = _.findWhere(this.stages, {name: oldStageName});
        let lead = _.findWhere(fromStage.leads, {Id: parseInt(leadId)});
        return this.updateLeadStage(lead, oldStageName, newStageName);
    }

    updateLeadStage(lead, oldStageName, newStageName) {
        let leadId = lead.Id || lead.id;
        let fromStage = _.findWhere(this.stages, {name: oldStageName}),
            toStage = _.findWhere(this.stages, {name: newStageName});
        if (fromStage && toStage) {
            let action = _.findWhere(fromStage.accessibleActions, {targetStageId: toStage.id});
            if (action && lead && !lead.locked) {
                lead.locked = true;
                if (action.sysId == 'CRM.CancelLead')
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
                            ).finally(() => lead.locked = false).subscribe((result) => { 
                                this.completeLeadUpdate(lead, fromStage, toStage);
                            });
                        } else
                            this.moveLeadTo(lead, toStage, fromStage);
                    });
                else if (action.sysId == 'CRM.UpdateLeadStage')
                    this._leadService.updateLeadStage(
                        UpdateLeadStageInfo.fromJS({
                            leadId: leadId, 
                            stageId: toStage.id
                        })
                    ).finally(() => lead.locked = false).subscribe((res) => { 
                        this.completeLeadUpdate(lead, fromStage, toStage);
                    });
                else if (action.sysId == 'CRM.ProcessLead')
                   this._leadService.processLead(
                        ProcessLeadInput.fromJS({
                            leadId: leadId
                        })
                    ).finally(() => lead.locked = false).subscribe((res) => { 
                        this.completeLeadUpdate(lead, fromStage, toStage);
                    }); 
            } else
                this.moveLeadTo(lead, toStage, fromStage);
                
            return action;
        }
    }

    moveLeadTo(lead, sourceStage, targetStage) {
        if (targetStage.leads)
            targetStage.leads.unshift(lead);
        lead.Stage = targetStage.name;
        lead.locked = false;
    }

    completeLeadUpdate(lead, fromStage, toStage) {
        lead.Stage = toStage.name;
        fromStage.total--;
        toStage.total++;
    }
}