/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Store, select } from '@node_modules/@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { filter, map, finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { LeadServiceProxy, CancelLeadInfo, UpdateLeadStageInfo, ProcessLeadInput, PipelineServiceProxy, PipelineDto } from '@shared/service-proxies/service-proxies';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class PipelineService {
    public stageChange: Subject<any>;
    public pipeline: PipelineDto;
    public stages = [];

    constructor(
        injector: Injector,
        private _dialog: MatDialog,
        private _leadService: LeadServiceProxy,
        private _pipelineServiceProxy: PipelineServiceProxy,
        private store$: Store<CrmStore.State>
    ) {
        this.stageChange = new Subject<any>();
    }

    getPipelineDefinitionObservable(pipelinePurposeId: string): Observable<PipelineDto> {
        return this.store$.pipe(
            select(PipelinesStoreSelectors.getSortedPipeline({
                purpose: pipelinePurposeId
            })),
            filter(pipelineDefinition => pipelineDefinition),
            map(pipelineDefinition => {
                this.pipeline = pipelineDefinition;
                pipelineDefinition.stages = this.stages =
                    _.sortBy(pipelineDefinition.stages, (stage) => {
                        return stage.sortOrder;
                    });
                return pipelineDefinition;
            })
        );
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
                        data: {}
                    }).afterClosed().subscribe(result => {
                        if (result) {
                            this._leadService.cancelLead(
                                CancelLeadInfo.fromJS({
                                    leadId: leadId,
                                    cancellationReasonId: result.reasonId,
                                    comment: result.comment
                                })
                            ).pipe(finalize(() => {
                                lead.locked = false;
                                complete && complete();
                            })).subscribe((result) => {
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
                    ).pipe(finalize(() => {
                        lead.locked = false;
                        complete && complete();
                    })).subscribe((res) => {
                        this.completeLeadUpdate(lead, fromStage, toStage);
                    });
                else if (action.sysId == AppConsts.SYS_ID_CRM_PROCESS_LEAD)
                   this._leadService.processLead(
                        ProcessLeadInput.fromJS({
                            leadId: leadId
                        })
                    ).pipe(finalize(() => {
                        lead.locked = false;
                        complete && complete();
                    })).subscribe((res) => {
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
        lead.stage = lead.Stage = toStage.name;
        fromStage.total--;
        toStage.total++;
        this.stageChange.next(lead);
    }
}
