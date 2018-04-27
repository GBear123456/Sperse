import { Injectable, Injector } from '@angular/core';
import { LeadServiceProxy, CancelLeadInfo, UpdateLeadStageInfo, ProcessLeadInput } from '@shared/service-proxies/service-proxies';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { MatDialog } from '@angular/material';

import * as _ from "underscore";

@Injectable()
export class PipelineService {
    stages = [];

    constructor(
        injector: Injector,
        private _dialog: MatDialog,
        private _leadService: LeadServiceProxy
    ) {  
    }

    updateLeadStage(leadId, oldStageName, newStageName) {
        let fromStage = _.findWhere(this.stages, {name: oldStageName}),
            toStage = _.findWhere(this.stages, {name: newStageName});
        if (fromStage && toStage) {
            let action = _.findWhere(fromStage.accessibleActions, {targetStageId: toStage.id});            
            if (action) {
                let lead = _.findWhere(fromStage.leads, {Id: parseInt(leadId)});
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
                            ).subscribe((result) => { 
                                lead.Stage = toStage.name;
                            });
                        } else
                            this.moveLeadTo(leadId, toStage, fromStage);
                    });
                else if (action.sysId == 'CRM.UpdateLeadStage')
                    this._leadService.updateLeadStage(
                        UpdateLeadStageInfo.fromJS({
                            leadId: leadId, 
                            stageId: toStage.id
                        })
                    ).finally(() => lead.locked = false).subscribe((res) => { 
                        lead.Stage = toStage.name;
                    });
                else if (action.sysId == 'CRM.ProcessLead')
                   this._leadService.processLead(
                        ProcessLeadInput.fromJS({
                            leadId: leadId
                        })
                    ).finally(() => lead.locked = false).subscribe((res) => { 
                        lead.Stage = toStage.name;
                    }); 
            } else
                this.moveLeadTo(leadId, toStage, fromStage);
                
            return action;
        }
    }

    moveLeadTo(leadId, sourceStage, targetStage) {
        let itemIndex = _.findIndex(sourceStage.leads, {Id: leadId}), 
            lead = sourceStage.leads.splice(itemIndex, 1).pop();
        targetStage.leads.unshift(lead);
        lead.Stage = targetStage.name;
    }
}