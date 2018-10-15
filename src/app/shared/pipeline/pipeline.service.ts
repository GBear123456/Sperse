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
import { LeadServiceProxy, CancelLeadInfo, UpdateLeadStageInfo, ProcessLeadInput, PipelineServiceProxy, 
    PipelineDto, ActivityServiceProxy, TransitionActivityDto } from '@shared/service-proxies/service-proxies';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class PipelineService {
    public stageChange: Subject<any>;
    private _pipelineDefinitions: any = {};

    constructor(
        injector: Injector,
        private _dialog: MatDialog,
        private _leadService: LeadServiceProxy,
        private _activityService: ActivityServiceProxy,
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
                this._pipelineDefinitions[pipelinePurposeId] = pipelineDefinition;
                pipelineDefinition.stages = _.sortBy(pipelineDefinition.stages, 
                    (stage) => {
                        return stage.sortOrder;
                    });
                return pipelineDefinition;
            })
        );
    }

    getStages(pipelinePurposeId: string): any {
        return this.getPipeline(pipelinePurposeId).stages;
    };

    getPipeline(pipelinePurposeId: string): PipelineDto {
        return this._pipelineDefinitions[pipelinePurposeId];
    }

    getStageByName(pipelinePurposeId: string, stageName: string) {
        return _.findWhere(this.getStages(pipelinePurposeId), {name: stageName});
    }

    updateEntityStageById(pipelinePurposeId, entityId, oldStageName, newStageName, complete = null) {
        let fromStage = this.getStageByName(pipelinePurposeId, oldStageName);
        if (fromStage) {
            let entity = _.findWhere(fromStage.leads, {Id: parseInt(entityId)});
            return entity && this.updateEntityStage(pipelinePurposeId, entity, oldStageName, newStageName, complete);
        }
    }

    updateEntityStage(pipelinePurposeId, entity, oldStageName, newStageName, complete = null) {
        let entityId = entity['Id'] || entity['id'],
            fromStage = this.getStageByName(pipelinePurposeId, oldStageName),
            toStage = this.getStageByName(pipelinePurposeId, newStageName);
        if (fromStage && toStage) {
            let action = _.findWhere(fromStage.accessibleActions, {targetStageId: toStage.id});
            if (action && action.sysId && entity && !entity.locked) {
                entity.locked = true;
                if (action.sysId == AppConsts.SYS_ID_CRM_UPDATE_ACTIVITY_STAGE) {
                    this._activityService.transition(TransitionActivityDto.fromJS({
                        id: entityId,
                        stageId: toStage.id
                    })).pipe(finalize(() => {
                        entity.locked = false;
                        complete && complete();
                    })).subscribe((res) => {
                        this.completeEntityUpdate(entity, fromStage, toStage);
                    });
                } else if (action.sysId == AppConsts.SYS_ID_CRM_CANCEL_LEAD)
                    this._dialog.open(LeadCancelDialogComponent, {
                        data: {}
                    }).afterClosed().subscribe(result => {
                        if (result) {
                            this._leadService.cancelLead(
                                CancelLeadInfo.fromJS({
                                    leadId: entityId,
                                    cancellationReasonId: result.reasonId,
                                    comment: result.comment
                                })
                            ).pipe(finalize(() => {
                                entity.locked = false;
                                complete && complete();
                            })).subscribe((result) => {
                                this.completeEntityUpdate(entity, fromStage, toStage);
                            });
                        } else {
                            this.moveEntityTo(entity, toStage, fromStage);
                            complete && complete();
                        }
                    });
                else if (action.sysId == AppConsts.SYS_ID_CRM_UPDATE_LEAD_STAGE)
                    this._leadService.updateLeadStage(
                        UpdateLeadStageInfo.fromJS({
                            leadId: entityId,
                            stageId: toStage.id
                        })
                    ).pipe(finalize(() => {
                        entity.locked = false;
                        complete && complete();
                    })).subscribe((res) => {
                        this.completeEntityUpdate(entity, fromStage, toStage);
                    });
                else if (action.sysId == AppConsts.SYS_ID_CRM_PROCESS_LEAD)
                   this._leadService.processLead(
                        ProcessLeadInput.fromJS({
                            leadId: entityId
                        })
                    ).pipe(finalize(() => {
                        entity.locked = false;
                        complete && complete();
                    })).subscribe((res) => {
                        this.completeEntityUpdate(entity, fromStage, toStage);
                    });
                else {
                    entity.locked = false;
                    complete && complete();
                }
            } else {
                this.moveEntityTo(entity, toStage, fromStage);
                complete && complete();
            }
            return action;
        } else
            complete && complete();
    }

    moveEntityTo(entity, sourceStage, targetStage) {
        if (sourceStage.leads && targetStage.leads)
            targetStage.leads.unshift(
                sourceStage.leads.splice(
                    sourceStage.leads.indexOf(entity), 1).pop());
        entity.StageId = targetStage.id;
        entity.stage = entity.Stage = targetStage.name;
        entity.locked = false;
    }

    completeEntityUpdate(entity, fromStage, toStage) {
        entity.StageId = toStage.id;
        entity.stage = entity.Stage = toStage.name;
        fromStage.total--;
        toStage.total++;
        this.stageChange.next(entity);
    }
}