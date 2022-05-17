/** Core imports */
import { Injectable, Injector } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

/** Third party imports */
import { NotifyService } from 'abp-ng2-module';
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@node_modules/@ngrx/store';
import { BehaviorSubject, ReplaySubject, Observable, Subject, of } from 'rxjs';
import { first, filter, map, finalize, switchMap, publishReplay, refCount } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import { CrmStore, PipelinesStoreSelectors } from '@app/crm/store';
import {
    LeadServiceProxy, CancelLeadInput, UpdateLeadStageInput, ProcessLeadInput,
    PipelineServiceProxy, PipelineDto, ActivityServiceProxy, TransitionActivityDto,
    OrderServiceProxy, UpdateOrderStageInfo, CancelOrderInfo, ProcessOrderInfo, StageDto, LayoutType
} from '@shared/service-proxies/service-proxies';
import { EntityCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { LeadCompleteDialogComponent } from './complete-lead-dialog/complete-lead-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CustomReuseStrategy } from '@shared/common/custom-reuse-strategy/custom-reuse-strategy.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { Stage } from '@app/shared/pipeline/stage.model';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { MessageService } from 'abp-ng2-module';
import { AppPermissions } from '@shared/AppPermissions';

interface StageColor {
    [stageSortOrder: string]: string;
}

@Injectable()
export class PipelineService {
    private stageChange: Subject<any> = new Subject<any>();
    stageChange$: Observable<any> = this.stageChange.asObservable();
    private pipelineDefinitions: { [pipelinePurposeId: string]: { [id: string]: PipelineDto } } = {};
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
    private lastIgnoreChecklist$: Observable<boolean>;
    private lastEntityData$: Observable<any>;
    private pipelineObservables: { [pipelinePurposeId: string]: { [id: string]: Observable<PipelineDto> } } = {};
    private allPipelineObservables: { [pipelinePurposeId: string]: Observable<PipelineDto[]> } = {};

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private message: MessageService,
        private reuseService: RouteReuseStrategy,
        private leadService: LeadServiceProxy,
        private orderService: OrderServiceProxy,
        private activityService: ActivityServiceProxy,
        private pipelineServiceProxy: PipelineServiceProxy,
        private permission: AppPermissionService,
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

    getAllPipelinesOberverable(pipelinePurposeId: string): Observable<PipelineDto[]> {
        let pipelines = this.allPipelineObservables[pipelinePurposeId];
        if (pipelines)
            return pipelines;

        return this.allPipelineObservables[pipelinePurposeId] = this.store$.pipe(
            select(PipelinesStoreSelectors.getPipelines({
                purpose: pipelinePurposeId
            })),
            filter((pipelines: PipelineDto[]) => !!pipelines),
            map((pipelines: PipelineDto[]) => {
                if (pipelines) {
                    pipelines.forEach(p => {
                        p.stages = _.sortBy(p.stages,
                            (stage: StageDto) => {
                                return stage.sortOrder;
                            });

                        if (!this.pipelineDefinitions[p.purpose])
                            this.pipelineDefinitions[p.purpose] = {};
                        if (!this.pipelineDefinitions[p.purpose][p.id])
                            this.pipelineDefinitions[p.purpose][p.id] = p;
                    });
                }
                return pipelines;
            }),
            publishReplay(1),
            refCount()
        ) as Observable<PipelineDto[]>;
    }

    getPipelineDefinitionObservable(pipelinePurposeId: string, contactGroupId: ContactGroup, pipelineId?: number): Observable<PipelineDto> {
        let pipelines = this.pipelineObservables[pipelinePurposeId] || {};
        const id = String(pipelineId || contactGroupId);
        if (pipelines[id])
            return pipelines[id];

        this.pipelineObservables[pipelinePurposeId] = pipelines;
        return pipelines[id] = this.store$.pipe(
            select(PipelinesStoreSelectors.getSortedPipeline({
                purpose: pipelinePurposeId,
                contactGroupId: contactGroupId,
                id: pipelineId
            })),
            filter((pipelineDefinition: PipelineDto) => {
                if (pipelineDefinition) {
                    let oldDefinition: PipelineDto = this.pipelineDefinitions[pipelinePurposeId]
                        && this.pipelineDefinitions[pipelinePurposeId][id];
                    if (!oldDefinition || !oldDefinition['generatedObs' + id] || pipelineDefinition.stages.length != oldDefinition.stages.length)
                        return true;

                    return pipelineDefinition.stages.some((stage: StageDto) => {
                        let oldStage = _.findWhere(oldDefinition.stages, {id: stage.id});
                        return !oldStage || oldStage.name != stage.name || oldStage.sortOrder != stage.sortOrder
                            || (oldStage.checklistPoints || []).length != (stage.checklistPoints || []).length;
                    });
                }
                return false;
            }),
            map((pipelineDefinition: PipelineDto) => {
                if (!this.pipelineDefinitions[pipelinePurposeId])
                    this.pipelineDefinitions[pipelinePurposeId] = {};
                this.pipelineDefinitions[pipelinePurposeId][id] = pipelineDefinition;
                pipelineDefinition.stages = _.sortBy(pipelineDefinition.stages,
                    (stage: StageDto) => {
                        return stage.sortOrder;
                    });
                pipelineDefinition['generatedObs' + id] = true;
                return pipelineDefinition;
            }),
            publishReplay(1),
            refCount()
        ) as Observable<PipelineDto>;
    }

    getStages(pipelinePurposeId: string, contactGroupId: ContactGroup, pipelineId?: number): StageDto[] {
        const pipeline = this.getPipeline(pipelinePurposeId, contactGroupId, pipelineId);
        return pipeline && pipeline.stages;
    }

    getStage(pipelinePurposeId: string, pipelineId: number, id: any): Stage {
        let pipeline = this.pipelineDefinitions[pipelinePurposeId][pipelineId];
        return <Stage>pipeline.stages.find(v => v.id == id);
    }

    getPipeline(pipelinePurposeId: string, contactGroupId: ContactGroup, pipelineId?: number): PipelineDto {
        const id = pipelineId || contactGroupId;
        let pipelines = this.pipelineDefinitions[pipelinePurposeId];
        return pipelines && pipelines[String(id)];
    }

    getStageByName(pipelinePurposeId: string, stageName: string, contactGroupId: ContactGroup, pipelineId?: number): Stage {
        return _.findWhere(this.getStages(pipelinePurposeId, contactGroupId, pipelineId), { name: stageName });
    }

    updateEntityStage(
        entity: any, fromStage: Stage, toStage: Stage, complete = null, forced = false
    ) {
        if (fromStage && toStage) {
            let isPipelineChange = fromStage.pipeline.id != toStage.pipeline.id,
                action = isPipelineChange ?
                    {sysId: AppConsts.SYS_ID_CRM_UPDATE_LEAD_STAGE} :
                    _.findWhere(fromStage.accessibleActions, {targetStageId: toStage.id});

            if (action && action.sysId && entity && !entity.locked) {
                entity.locked = true;
                if (action.sysId == AppConsts.SYS_ID_CRM_UPDATE_ACTIVITY_STAGE)
                    this.activityTransition(fromStage, toStage, entity, complete);
                else if (action.sysId == AppConsts.SYS_ID_CRM_CANCEL_LEAD)
                    this.cancelLead(fromStage, toStage, entity, complete);
                else if (action.sysId == AppConsts.SYS_ID_CRM_UPDATE_LEAD_STAGE)
                    this.updateLeadStage(fromStage, toStage, entity, complete, forced, isPipelineChange);
                else if (action.sysId == AppConsts.SYS_ID_CRM_PROCESS_LEAD)
                    this.processLead(fromStage, toStage, entity, complete, forced);
                else if (action.sysId == AppConsts.SYS_ID_CRM_CANCEL_ORDER)
                    this.cancelOrder(fromStage, toStage, entity, complete);
                else if (action.sysId == AppConsts.SYS_ID_CRM_UPDATE_ORDER_STAGE)
                    this.updateOrderStage(fromStage, toStage, entity, complete, forced);
                else if (action.sysId == AppConsts.SYS_ID_CRM_PROCESS_ORDER) {
                    this.processOrder(fromStage, toStage, entity, complete, forced);
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

    updateEntitiesStage(pipelinePurposeId: string, entities, targetStageName: string, contactGroupId: ContactGroup): Observable<any> {
        let subject = new Subject<any>();
        this.updateEntitiesStageInternal(
            pipelinePurposeId,
            contactGroupId,
            entities.slice(0),
            targetStageName,
            null,
            (declinedList) => {
                this.resetIgnoreChecklist();
                subject.next(declinedList);
            }, []
        );

        return subject.asObservable();
    }

    private updateEntitiesStageInternal(pipelinePurposeId: string, contactGroupId: ContactGroup,
        entities, targetStageName: string, data, complete, declinedList
    ) {
        let entity = entities.pop();
        if (entity) {
            if (data)
                entity.data = data;
            if (
                !this.updateEntityStage(
                    entity,
                    this.getStageByName(pipelinePurposeId, entity.Stage || entity.stage, contactGroupId),
                    this.getStageByName(pipelinePurposeId, targetStageName, contactGroupId),
                    (data) => {
                        this.updateEntitiesStageInternal(
                            pipelinePurposeId,
                            contactGroupId,
                            entities,
                            targetStageName,
                            data || entity.data,
                            complete,
                            declinedList
                        );
                        delete entity.data;
                    }, true
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
        }, () => {
            this.moveEntityTo(entity, toStage, fromStage);
        });
    }

    updateLeadStage(fromStage: Stage, toStage: Stage, entity, complete, useLastData = false, updatePipeline = false) {
        let leadId = this.getEntityId(entity);
        this.ignoreStageChecklist(fromStage,
            updatePipeline || toStage.sortOrder > fromStage.sortOrder ? leadId : null, useLastData, false
        ).subscribe(ignore => {
            this.leadService.updateLeadStage(
                new UpdateLeadStageInput({
                    leadId: leadId,
                    stageId: toStage.id,
                    sortOrder: entity.SortOrder,
                    ignoreChecklist: ignore,
                    allowPipelineChange: updatePipeline
                })
            ).pipe(finalize(() => {
                entity.locked = false;
                complete && complete();
            })).subscribe(() => {
                this.completeEntityUpdate(entity, fromStage, toStage);
            }, () => {
                this.moveEntityTo(entity, toStage, fromStage);
            });
        }, () => {
            this.moveEntityTo(entity, toStage, fromStage);
            entity.locked = false;
            complete && complete(true);
        });
    }

    processLead(fromStage: Stage, toStage: Stage, entity, complete, useLastData = false) {
        this.ignoreStageChecklist(fromStage, this.getEntityId(entity), useLastData).subscribe(ignore => {
            if (entity.data)
                return this.processLeadInternal(entity,
                    {...entity.data, fromStage, toStage, ignoreChecklist: ignore}, complete);
            if (!useLastData || !this.lastEntityData$) {
                this.lastEntityData$ = fromStage.pipeline.contactGroupId == ContactGroup.Client &&
                    this.permission.isGranted(AppPermissions.CRMOrders) ? this.getPipelineDefinitionObservable(
                        AppConsts.PipelinePurposeIds.order, null
                    ).pipe(first(),
                        switchMap((pipeline: PipelineDto) => {
                            return this.dialog.open(LeadCompleteDialogComponent, {
                                data: {
                                    entity: entity,
                                    stages: pipeline.stages
                                }
                            }).afterClosed();
                        }), publishReplay(), refCount()
                ) : of({});
            }

            this.lastEntityData$.subscribe(data => {
                toStage.isLoading = false;
                fromStage.isLoading = false;
                this.lastEntityData$ = undefined;
                if (data)
                    this.processLeadInternal(entity,
                        {...data, fromStage, toStage, ignoreChecklist: ignore}, complete);
                else {
                    this.moveEntityTo(entity, toStage, fromStage);
                    entity.locked = false;
                    complete && complete(true);
                }
            });
        }, () => {
            this.moveEntityTo(entity, toStage, fromStage);
            entity.locked = false;
            complete && complete(true);
        });
    }

    private processLeadInternal(entity, data, complete) {
        let processLeadInput = new ProcessLeadInput();
        processLeadInput.leadId = this.getEntityId(entity);
        processLeadInput.ignoreChecklist = data.ignoreChecklist;
        processLeadInput.orderStageId = data.orderStageId;
        if (data.orderStageId) {
            processLeadInput.amount = data.amount;
            processLeadInput.comment = data.comment;
        }

        this.leadService.processLead(
            processLeadInput
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
            (this.reuseService as CustomReuseStrategy).invalidate('orders');
        })).subscribe(() => {
            this.completeEntityUpdate(entity, data.fromStage, data.toStage);
        });
    }

    private ignoreStageChecklist(stage: Stage, entityId: number, useLastData = false, isOrder = false): Observable<boolean> {
        if (useLastData && this.lastIgnoreChecklist$)
            return this.lastIgnoreChecklist$;
        else if (stage.checklistPoints && stage.checklistPoints.length && entityId)
            return (isOrder ? this.orderService.getStageChecklistPoints(entityId, undefined) :
                this.leadService.getStageChecklistPoints(entityId, undefined)
            ).pipe(switchMap(stages => {
                if (useLastData && this.lastIgnoreChecklist$)
                    return this.lastIgnoreChecklist$;
                else if (stages.every(item => item.isDone))
                    return of(false);

                let subject = new ReplaySubject<boolean>(1);
                this.lastIgnoreChecklist$ = subject.asObservable();

                this.message.confirm(
                    this.ls.l('ChecklistConfirmationMessage'), '',
                    isConfirmed => {
                        if (isConfirmed)
                            subject.next(true);
                        else
                            subject.error({});
                        subject.complete();
                    }
                );

                return this.lastIgnoreChecklist$;
            }));
        else
            return of(false);
    }

    cancelLead(fromStage: Stage, toStage: Stage, entity, complete) {
        if (entity.data)
            this.cancelLeadInternal(entity, {...entity.data, fromStage, toStage}, complete);
        else {
            toStage.isLoading = false;
            fromStage.isLoading = false;
            this.dialog.open(EntityCancelDialogComponent, {
                data: {
                    showReasonField: true
                }
            }).afterClosed().subscribe(data => {
                if (data)
                    this.cancelLeadInternal(entity, {...data, fromStage, toStage}, complete);
                else {
                    this.moveEntityTo(entity, toStage, fromStage);
                    complete && complete(true);
                }
            });
        }
    }

    private cancelLeadInternal(entity, data, complete) {
        this.leadService.cancelLead(
            CancelLeadInput.fromJS({
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

    updateOrderStage(fromStage: Stage, toStage: Stage, entity, complete, useLastData = false) {
        let orderId = this.getEntityId(entity);
        this.ignoreStageChecklist(fromStage,
            toStage.sortOrder > fromStage.sortOrder ? orderId : null, useLastData, true
        ).subscribe(ignore => {
            this.orderService.updateStage(
                UpdateOrderStageInfo.fromJS({
                    orderId: this.getEntityId(entity),
                    stageId: toStage.id,
                    sortOrder: entity.SortOrder,
                    ignoreChecklist: ignore
                })
            ).pipe(finalize(() => {
                entity.locked = false;
                complete && complete();
            })).subscribe(() => {
                this.completeEntityUpdate(entity, fromStage, toStage);
            }, () => {
                this.moveEntityTo(entity, toStage, fromStage);
            });
        }, () => {
            this.moveEntityTo(entity, toStage, fromStage);
            entity.locked = false;
            complete && complete(true);
        });
    }

    processOrder(fromStage: Stage, toStage: Stage, entity, complete, useLastData = false) {
        this.ignoreStageChecklist(fromStage, this.getEntityId(entity), useLastData, true).subscribe(ignore => {
            let model: ProcessOrderInfo = new ProcessOrderInfo();
            model.id = this.getEntityId(entity);
            model.sortOrder = entity.SortOrder;
            model.ignoreChecklist = ignore;
            this.orderService.process(
                model
            ).pipe(finalize(() => {
                entity.locked = false;
                complete && complete();
            })).subscribe(() => {
                this.completeEntityUpdate(entity, fromStage, toStage);
            }, () => {
                this.moveEntityTo(entity, toStage, fromStage);
            });
        }, () => {
            this.moveEntityTo(entity, toStage, fromStage);
            entity.locked = false;
            complete && complete(true);
        });
    }

    cancelOrder(fromStage: Stage, toStage: Stage, entity, complete) {
        if (entity.data)
            this.cancelOrderInternal(entity, {...entity.data, fromStage, toStage}, complete);
        else {
            toStage.isLoading = false;
            fromStage.isLoading = false;
            this.dialog.open(EntityCancelDialogComponent, {
                data: {}
            }).afterClosed().subscribe(data => {
                if (data)
                    this.cancelOrderInternal(entity, {...data, fromStage, toStage}, complete);
                else {
                    this.moveEntityTo(entity, toStage, fromStage);
                    complete && complete(true);
                }
            });
        }
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
        if (sourceStage.entities && targetStage.entities) {
            let index = sourceStage.entities.indexOf(entity);
            if (index >= 0)
                sourceStage.entities.splice(index, 1);
            if (targetStage.entities.indexOf(entity) < 0)
                targetStage.entities.unshift(entity);
        }

        entity.stageId = entity.StageId = targetStage.id;
        entity.stage = entity.Stage = targetStage.name;
        entity.locked = false;
    }

    completeEntityUpdate(entity, fromStage: Stage, toStage: Stage) {
        entity.stageId = entity.StageId = toStage.id;
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

    getStageColorByName(stageName: string, contactGroupId: ContactGroup): string {
        const stage = this.getStageByName(AppConsts.PipelinePurposeIds.lead, stageName, contactGroupId);
        return this.getStageDefaultColorByStageSortOrder(stage && stage.sortOrder);
    }

    getStageDefaultColorByStageSortOrder(stageSortOrder: number): string {
        const layoutType = this.appSessionService.layoutType;
        const stagesColors = this.defaultStagesColors[layoutType] || this.defaultStagesColors[LayoutType.Default];
        /** Get default or the closest color */
        let color = stagesColors[stageSortOrder];
        /** If there is not default color for the sort order - get the closest */
        if (!color) {
            let maxSortOrder = Math.floor(Object.keys(stagesColors).length / 2);
            color = stagesColors[maxSortOrder > stageSortOrder ? maxSortOrder * -1 : maxSortOrder];
        }
        return color;
    }

    resetIgnoreChecklist() {
        this.lastIgnoreChecklist$ = undefined;
    }
}