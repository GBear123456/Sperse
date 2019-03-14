/** Core imports */
import { Injectable, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@node_modules/@ngrx/store';
import { Observable, Subject, of } from 'rxjs';
import { filter, map, finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import { LeadServiceProxy, CancelLeadInfo, UpdateLeadStageInfo, ProcessLeadInput, PipelineServiceProxy,
    PipelineDto, ActivityServiceProxy, TransitionActivityDto } from '@shared/service-proxies/service-proxies';
import { LeadCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { LeadCompleteDialogComponent } from './complete-lead-dialog/complete-lead-dialog.component';
import { AppConsts } from '@shared/AppConsts';

interface StageColor {
    [stageSortOrder: string]: string;
}

@Injectable()
export class PipelineService {
    public stageChange: Subject<any>;
    private _pipelineDefinitions: any = {};
    private defaultStagesColors: StageColor = {
        '-3': '#f05b29',
        '-2': '#f4ae55',
        '-1': '#f7d15e',
        '0': '#00aeef',
        '1': '#b6cf5e',
        '2': '#86c45d',
        '3': '#46aa6e'
    };

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
        if (this._pipelineDefinitions[pipelinePurposeId])
            return of(this._pipelineDefinitions[pipelinePurposeId]);
        else
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
    }

    getPipeline(pipelinePurposeId: string): PipelineDto {
        return this._pipelineDefinitions[pipelinePurposeId];
    }

    getStageByName(pipelinePurposeId: string, stageName: string) {
        return _.findWhere(this.getStages(pipelinePurposeId), {name: stageName});
    }

    updateEntityStageById(pipelinePurposeId, entityId, oldStageName, newStageName, complete = null) {
        let fromStage = this.getStageByName(pipelinePurposeId, oldStageName);
        if (fromStage) {
            let entity = _.findWhere(fromStage.entities, {Id: parseInt(entityId)});
            return entity && this.updateEntityStage(pipelinePurposeId, entity, oldStageName, newStageName, complete);
        }
    }

    updateEntityStage(pipelinePurposeId, entity, oldStageName, newStageName, complete = null) {
        let fromStage = this.getStageByName(pipelinePurposeId, oldStageName),
            toStage = this.getStageByName(pipelinePurposeId, newStageName);
        if (fromStage && toStage) {
            let action = _.findWhere(fromStage.accessibleActions, {targetStageId: toStage.id});
            if (action && action.sysId && entity && !entity.locked) {
                entity.locked = true;
                if (action.sysId == AppConsts.SYS_ID_CRM_UPDATE_ACTIVITY_STAGE)
                    this.activityTransition(fromStage, toStage, entity, complete);
                else if (action.sysId == AppConsts.SYS_ID_CRM_CANCEL_LEAD)
                    this.cancelLead(fromStage, toStage, entity, complete);
                else if (action.sysId == AppConsts.SYS_ID_CRM_UPDATE_LEAD_STAGE)
                    this.updateLeadStage(fromStage, toStage, entity, complete);
                else if (action.sysId == AppConsts.SYS_ID_CRM_PROCESS_LEAD) {
                    this.processLead(fromStage, toStage, entity, complete);
                } else {
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

    getEntityId(entity) {
        return entity['Id'] || entity['id'];
    }

    activityTransition(fromStage, toStage, entity, complete) {
        this._activityService.transition(TransitionActivityDto.fromJS({
            id: this.getEntityId(entity),
            stageId: toStage.id
        })).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe((res) => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    updateLeadStage(fromStage, toStage, entity, complete) {
        this._leadService.updateLeadStage(
            UpdateLeadStageInfo.fromJS({
                leadId: this.getEntityId(entity),
                stageId: toStage.id
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe((res) => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    processLead(fromStage, toStage, entity, complete) {
        this._dialog.open(LeadCompleteDialogComponent, {
            data: {
                stages: this._pipelineDefinitions[AppConsts.PipelinePurposeIds.lead].stages
            }
        }).afterClosed().subscribe(data => {
            if (data)
                this._leadService.processLead(
                    ProcessLeadInput.fromJS({
                        leadId: this.getEntityId(entity),
                        orderStageId: data.orderStageId,
                        amount: data.amount,
                        comment: data.comment,
                    })
                ).pipe(finalize(() => {
                    entity.locked = false;
                    complete && complete();
                })).subscribe((res) => {
                    this.completeEntityUpdate(entity, fromStage, toStage);
                });
            else {
                this.moveEntityTo(entity, toStage, fromStage);
                complete && complete();
            }
        });
    }

    cancelLead(fromStage, toStage, entity, complete) {
        this._dialog.open(LeadCancelDialogComponent, {
            data: {}
        }).afterClosed().subscribe(result => {
            if (result) {
                this._leadService.cancelLead(
                    CancelLeadInfo.fromJS({
                        leadId: this.getEntityId(entity),
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
    }

    moveEntityTo(entity, sourceStage, targetStage) {
        if (sourceStage.entities && targetStage.entities)
            targetStage.entities.unshift(
                sourceStage.entities.splice(
                    sourceStage.entities.indexOf(entity), 1).pop());
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

    getStageDefaultColorByStageSortOrder(stageSortOrder: number) {
        /** Get default or the closest color */
        let color = this.defaultStagesColors[stageSortOrder] ;
        /** If there is not default color for the sort order - get the closest */
        if (!color) {
            const defaultColorsKeys = Object.keys(this.defaultStagesColors);
            color = +defaultColorsKeys[0] > stageSortOrder ? this.defaultStagesColors[defaultColorsKeys[0]] : this.defaultStagesColors[defaultColorsKeys[defaultColorsKeys.length]];
        }
        return color;
    }
}