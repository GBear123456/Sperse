/** Core imports */
import { Injectable, Injector } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { NotifyService } from '@abp/notify/notify.service';
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@node_modules/@ngrx/store';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map, finalize } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import {
    LeadServiceProxy, CancelLeadInfo, UpdateLeadStageInfo, ProcessLeadInput,
    PipelineServiceProxy, PipelineDto, ActivityServiceProxy, TransitionActivityDto,
    OrderServiceProxy, UpdateOrderStageInfo, CancelOrderInfo, ProcessOrderInfo, StageDto, LayoutType
} from '@shared/service-proxies/service-proxies';
import { EntityCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { LeadCompleteDialogComponent } from './complete-lead-dialog/complete-lead-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CustomReuseStrategy } from '@root/root-routing.module';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { Stage } from '@app/shared/pipeline/stage.model';
import { AppSessionService } from '@shared/common/session/app-session.service';

interface StageColor {
    [stageSortOrder: string]: string;
}

@Injectable()
export class PipelineService {
    private stageChange: Subject<any> = new Subject<any>();
    stageChange$: Observable<any> = this.stageChange.asObservable();
    private pipelineDefinitions: any = {};
    private defaultStagesColors: { [layoutType: string]: StageColor } = {
        [LayoutType.Default]: {
            '-4': '#f02929',
            '-3': '#f05b29',
            '-2': '#f4ae55',
            '-1': '#f7d15e',
            '0': '#00aeef',
            '1': '#b6cf5e',
            '2': '#86c45d',
            '3': '#46aa6e',
            '4': '#0e9360'
        },
        [LayoutType.AdvicePeriod]: {
            '-4': '#e47822',
            '-3': '#c3dfe9',
            '-2': '#a5cfdf',
            '-1': '#3d8ba9',
            '0': '#fed142',
            '1': '#ffab3e',
            '2': '#c4e18c',
            '3': '#99c24d',
            '4': '#0e9360'
        }
    };
    private dataLayoutType: BehaviorSubject<DataLayoutType> = new BehaviorSubject<DataLayoutType>(DataLayoutType.Pipeline);
    dataLayoutType$: Observable<DataLayoutType> = this.dataLayoutType.asObservable();
    private compactView: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    compactView$: Observable<boolean> = this.compactView.asObservable();

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private reuseService: RouteReuseStrategy,
        private leadService: LeadServiceProxy,
        private orderService: OrderServiceProxy,
        private activityService: ActivityServiceProxy,
        private pipelineServiceProxy: PipelineServiceProxy,
        private ls: AppLocalizationService,
        private notify: NotifyService,
        private store$: Store<CrmStore.State>,
        private appSessionService: AppSessionService
    ) {}

    toggleDataLayoutType(dataLayoutType: DataLayoutType) {
        this.dataLayoutType.next(dataLayoutType);
    }

    toggleContactView() {
        this.compactView.next(!this.compactView.value);
    }

    getPipelineDefinitionObservable(pipelinePurposeId: string, contactGroupId?: ContactGroup): Observable<PipelineDto> {
        return this.store$.pipe(
            select(PipelinesStoreSelectors.getSortedPipeline({
                purpose: pipelinePurposeId,
                contactGroupId: contactGroupId
            })),
            filter(Boolean),
            map(pipelineDefinition => {
                this.pipelineDefinitions[pipelinePurposeId] = pipelineDefinition;
                pipelineDefinition.stages = _.sortBy(pipelineDefinition.stages,
                    (stage) => {
                        return stage.sortOrder;
                    });
                return pipelineDefinition;
            })
        );
    }

    getStages(pipelinePurposeId: string): StageDto[] {
        return this.getPipeline(pipelinePurposeId).stages;
    }

    getPipeline(pipelinePurposeId: string): PipelineDto {
        return this.pipelineDefinitions[pipelinePurposeId];
    }

    getStageByName(pipelinePurposeId: string, stageName: string): Stage {
        return _.findWhere(this.getStages(pipelinePurposeId), {name: stageName});
    }

    updateEntityStage(pipelinePurposeId: string, entity, fromStage: Stage, toStage: Stage, complete = null) {
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
                else if (action.sysId == AppConsts.SYS_ID_CRM_PROCESS_LEAD)
                    this.processLead(fromStage, toStage, entity, complete);
                else if (action.sysId == AppConsts.SYS_ID_CRM_CANCEL_ORDER)
                    this.cancelOrder(fromStage, toStage, entity, complete);
                else if (action.sysId == AppConsts.SYS_ID_CRM_UPDATE_ORDER_STAGE)
                    this.updateOrderStage(fromStage, toStage, entity, complete);
                else if (action.sysId == AppConsts.SYS_ID_CRM_PROCESS_ORDER) {
                    this.processOrder(fromStage, toStage, entity, complete);
                } else {
                    entity.locked = false;
                    complete && complete();
                }
            } else {
                entity.Name && this.notify.warn(this.ls.l('StageCannotBeUpdated', entity.Name));
                complete && setTimeout(() => complete());
            }
            return action;
        } else
            complete && complete();
    }

    updateEntitiesStage(pipelineId, entities, targetStageName: string) {
        let subject = new Subject<any>();

        this.updateEntitiesStageInternal(
            pipelineId,
            entities.slice(0),
            targetStageName,
            null,
            (declinedList) => subject.next(declinedList),
            []
        );

        return subject.asObservable();
    }

    private updateEntitiesStageInternal(pipelineId, entities, targetStageName: string, data, complete, declinedList) {
        let entity = entities.pop();
        if (entity) {
            if (data)
                entity.data = data;
            if (
                !this.updateEntityStage(
                    pipelineId,
                    entity,
                    this.getStageByName(pipelineId, entity.Stage || entity.stage),
                    this.getStageByName(pipelineId, targetStageName),
                    (data) => {
                        this.updateEntitiesStageInternal(
                            pipelineId,
                            entities,
                            targetStageName,
                            data || entity.data,
                            complete,
                            declinedList
                        );
                        delete entity.data;
                    }
                )
            ) declinedList.push(entity);
        } else
            complete && complete(declinedList);
    }

    getEntityId(entity) {
        return entity['Id'] || entity['id'];
    }

    activityTransition(fromStage: Stage, toStage: Stage, entity, complete) {
        this.activityService.transition(TransitionActivityDto.fromJS({
            id: this.getEntityId(entity),
            stageId: toStage.id,
            sortOrder: entity.SortOrder
        })).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe(() => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    updateLeadStage(fromStage: Stage, toStage: Stage, entity, complete) {
        this.leadService.updateLeadStage(
            new UpdateLeadStageInfo({
                leadId: this.getEntityId(entity),
                stageId: toStage.id,
                sortOrder: entity.SortOrder
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe(() => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    processLead(fromStage: Stage, toStage: Stage, entity, complete) {
        if (entity.data)
            this.processLeadInternal(entity, {...entity.data, fromStage, toStage}, complete);
        else
            this.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.order).subscribe(
                (pipeline) => {
                    this.dialog.open(LeadCompleteDialogComponent, {
                        data: {
                            stages: pipeline.stages
                        }
                    }).afterClosed().subscribe(data => {
                        if (data)
                            this.processLeadInternal(entity, {...data, fromStage, toStage}, complete);
                        else {
                            this.moveEntityTo(entity, fromStage, toStage);
                            complete && complete();
                        }
                    });
                }
            );
    }

    private processLeadInternal(entity, data, complete) {
        this.leadService.processLead(
            ProcessLeadInput.fromJS({
                leadId: this.getEntityId(entity),
                orderStageId: data.orderStageId,
                amount: data.amount,
                comment: data.comment,
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete(data);
            (this.reuseService as CustomReuseStrategy).invalidate('orders');
        })).subscribe(() => {
            this.completeEntityUpdate(entity, data.fromStage, data.toStage);
        });
    }

    cancelLead(fromStage: Stage, toStage: Stage, entity, complete) {
        if (entity.data)
            this.cancelLeadInternal(entity, {...entity.data, fromStage, toStage}, complete);
        else
            this.dialog.open(EntityCancelDialogComponent, {
                data: {
                    showReasonField: true
                }
            }).afterClosed().subscribe(data => {
                if (data)
                    this.cancelLeadInternal(entity, {...data, fromStage, toStage}, complete);
                else {
                    this.moveEntityTo(entity, fromStage, toStage);
                    complete && complete();
                }
            });
    }

    private cancelLeadInternal(entity, data, complete) {
        this.leadService.cancelLead(
            CancelLeadInfo.fromJS({
                leadId: this.getEntityId(entity),
                cancellationReasonId: data.reasonId,
                comment: data.comment
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete(data);
        })).subscribe(() => {
            this.completeEntityUpdate(entity, data.fromStage, data.toStage);
        });
    }

    updateOrderStage(fromStage: Stage, toStage: Stage, entity, complete) {
        this.orderService.updateStage(
            UpdateOrderStageInfo.fromJS({
                orderId: this.getEntityId(entity),
                stageId: toStage.id,
                sortOrder: entity.SortOrder
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe(() => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    processOrder(fromStage: Stage, toStage: Stage, entity, complete) {
        let model: ProcessOrderInfo = new ProcessOrderInfo();
        model.id = this.getEntityId(entity);
        model.sortOrder = entity.SortOrder;
        this.orderService.process(
            model
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe(() => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    cancelOrder(fromStage: Stage, toStage: Stage, entity, complete) {
        if (entity.data)
            this.cancelOrderInternal(entity, {...entity.data, fromStage, toStage}, complete);
        else
            this.dialog.open(EntityCancelDialogComponent, {
                data: {}
            }).afterClosed().subscribe(data => {
                if (data)
                    this.cancelOrderInternal(entity, {...data, fromStage, toStage}, complete);
                else {
                    this.moveEntityTo(entity, fromStage, toStage);
                    complete && complete();
                }
            });
    }

    private cancelOrderInternal(entity, data, complete) {
        this.orderService.cancel(
            CancelOrderInfo.fromJS({
                orderId: this.getEntityId(entity),
                comment: data.comment
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete(data);
        })).subscribe(() => {
            this.completeEntityUpdate(entity, data.fromStage, data.toStage);
        });
    }

    moveEntityTo(entity, sourceStage: Stage, targetStage: Stage) {
        if (sourceStage.entities && targetStage.entities)
            targetStage.entities.unshift(
                sourceStage.entities.splice(sourceStage.entities.indexOf(entity), 1).pop()
            );
        entity.StageId = targetStage.id;
        entity.stage = entity.Stage = targetStage.name;
        entity.locked = false;
    }

    completeEntityUpdate(entity, fromStage: Stage, toStage: Stage) {
        entity.StageId = toStage.id;
        entity.stage = entity.Stage = toStage.name;
        fromStage.total--;
        toStage.total++;
        this.stageChange.next(entity);
    }

    getPrevEntity(entity, entities) {
        for (let i = 0; i < entities.length ; i++) {
            if (entities[i].Id == entity.Id)
                return entities[i - 1];
        }
    }

    getEntityNewSortOrder(entity, stage: Stage) {
        let entities = stage.entities;
        if (entity) {
            let prevEntity = this.getPrevEntity(entity, entities);
            return entities.length ? prevEntity && prevEntity.SortOrder
                || entities[0].SortOrder + 1 : 0;
        } else
            return entities.length && entities.slice(-1).pop().SortOrder || 0;
    }

    updateEntitySortOrder(pipelineId, entity, complete) {
        if (!entity.locked) {
            entity.locked = true;
            this.pipelineServiceProxy.updateEntitySortOrder(
                pipelineId, entity.Id, entity.SortOrder
            ).pipe(finalize(() => {
                entity.locked = false;
            })).subscribe(complete, complete);
        } else
            complete && complete();
    }

    getStageDefaultColorByStageSortOrder(stageSortOrder: number): string {
        const layoutType = this.appSessionService.layoutType;
        const stagesColors = this.defaultStagesColors[layoutType] || this.defaultStagesColors[LayoutType.Default];
        /** Get default or the closest color */
        let color = stagesColors[stageSortOrder];
        /** If there is not default color for the sort order - get the closest */
        if (!color) {
            const defaultColorsKeys = Object.keys(stagesColors);
            color = +defaultColorsKeys[0] > stageSortOrder
                ? stagesColors[defaultColorsKeys[0]]
                : stagesColors[defaultColorsKeys[defaultColorsKeys.length]];
        }
        return color;
    }

}
