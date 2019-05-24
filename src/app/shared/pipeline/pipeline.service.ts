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
import { LeadServiceProxy, CancelLeadInfo, UpdateLeadStageInfo, ProcessLeadInput,
    PipelineServiceProxy, PipelineDto, ActivityServiceProxy, TransitionActivityDto,
    OrderServiceProxy, UpdateOrderStageInfo, CancelOrderInfo, ProcessOrderInfo } from '@shared/service-proxies/service-proxies';
import { EntityCancelDialogComponent } from './confirm-cancellation-dialog/confirm-cancellation-dialog.component';
import { LeadCompleteDialogComponent } from './complete-lead-dialog/complete-lead-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CustomReuseStrategy } from '@root/root-routing.module';
import { AppConsts } from '@shared/AppConsts';
import { ContactGroup } from '@shared/AppEnums';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';

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
    private _dataLayoutType: BehaviorSubject<DataLayoutType> = new BehaviorSubject<DataLayoutType>(DataLayoutType.Pipeline);
    dataLayoutType$: Observable<DataLayoutType> = this._dataLayoutType.asObservable();
    private _compactView: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    compactView$: Observable<boolean> = this._compactView.asObservable();

    constructor(
        injector: Injector,
        private _dialog: MatDialog,
        private _reuseService: RouteReuseStrategy,
        private _leadService: LeadServiceProxy,
        private _orderService: OrderServiceProxy,
        private _activityService: ActivityServiceProxy,
        private _pipelineServiceProxy: PipelineServiceProxy,
        private _ls: AppLocalizationService,
        private _notify: NotifyService,
        private store$: Store<CrmStore.State>
    ) {
        this.stageChange = new Subject<any>();
    }

    toggleDataLayoutType(dataLayoutType: DataLayoutType) {
        this._dataLayoutType.next(dataLayoutType);
    }

    toggleContactView() {
        this._compactView.next(!this._compactView.value);
    }

    getPipelineDefinitionObservable(pipelinePurposeId: string, contactGroupId?: ContactGroup): Observable<PipelineDto> {
        return this.store$.pipe(
            select(PipelinesStoreSelectors.getSortedPipeline({
                purpose: pipelinePurposeId,
                contactGroupId: contactGroupId
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

    updateEntityStage(pipelinePurposeId, entity, fromStage, toStage, complete = null) {
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
                this.moveEntityTo(entity, toStage, fromStage);
                entity.Name && this._notify.warn(this._ls.l('StageCannotBeUpdated',
                    AppConsts.localization.defaultLocalizationSourceName, entity.Name));
                complete && setTimeout(() => complete());
            }
            return action;
        } else
            complete && complete();
    }

    updateEntitiesStage(pipelineId, entities, targetStage) {
        let subject = new Subject<any>();

        this.updateEntitiesStageInternal(pipelineId, entities.slice(0),
            targetStage, null, (declinedList) => subject.next(declinedList), []);

        return subject.asObservable();
    }

    private updateEntitiesStageInternal(pipelineId, entities, targetStage, data, complete, declinedList) {
        let entity = entities.pop();
        if (entity) {
            if (data)
                entity.data = data;
            if (!this.updateEntityStage(pipelineId, entity,
                this.getStageByName(pipelineId, entity.Stage || entity.stage),
                this.getStageByName(pipelineId, targetStage), (data) => {
                    this.updateEntitiesStageInternal(pipelineId, entities, targetStage, data || entity.data, complete, declinedList);
                    delete entity.data;
            })) declinedList.push(entity);
        } else
            complete && complete(declinedList);
    }

    getEntityId(entity) {
        return entity['Id'] || entity['id'];
    }

    activityTransition(fromStage, toStage, entity, complete) {
        this._activityService.transition(TransitionActivityDto.fromJS({
            id: this.getEntityId(entity),
            stageId: toStage.id,
            sortOrder: entity.SortOrder
        })).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe((res) => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    updateLeadStage(fromStage, toStage, entity, complete) {
        let prevEntity = this.getPrevEntity(entity, toStage);
        this._leadService.updateLeadStage(
            UpdateLeadStageInfo.fromJS({
                leadId: this.getEntityId(entity),
                stageId: toStage.id,
                sortOrder: entity.SortOrder
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe((res) => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    processLead(fromStage, toStage, entity, complete) {
        if (entity.data)
            this.processLeadInternal(entity, {...entity.data, fromStage, toStage}, complete);
        else
            this.getPipelineDefinitionObservable(AppConsts.PipelinePurposeIds.order).subscribe(
                (pipeline) => {
                    this._dialog.open(LeadCompleteDialogComponent, {
                        data: {
                            stages: pipeline.stages
                        }
                    }).afterClosed().subscribe(data => {
                        if (data)
                            this.processLeadInternal(entity, {...data, fromStage, toStage}, complete);
                        else {
                            this.moveEntityTo(entity, toStage, fromStage);
                            complete && complete();
                        }
                    });
                }
            );
    }

    private processLeadInternal(entity, data, complete) {
        this._leadService.processLead(
            ProcessLeadInput.fromJS({
                leadId: this.getEntityId(entity),
                orderStageId: data.orderStageId,
                amount: data.amount,
                comment: data.comment,
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete(data);
            (this._reuseService as CustomReuseStrategy).invalidate('orders');
        })).subscribe((res) => {
            this.completeEntityUpdate(entity, data.fromStage, data.toStage);
        });
    }

    cancelLead(fromStage, toStage, entity, complete) {
        if (entity.data)
            this.cancelLeadInternal(entity, {...entity.data, fromStage, toStage}, complete);
        else
            this._dialog.open(EntityCancelDialogComponent, {
                data: {
                    showReasonField: true
                }
            }).afterClosed().subscribe(data => {
                if (data)
                    this.cancelLeadInternal(entity, {...data, fromStage, toStage}, complete);
                else {
                    this.moveEntityTo(entity, toStage, fromStage);
                    complete && complete();
                }
            });
    }

    private cancelLeadInternal(entity, data, complete) {
        this._leadService.cancelLead(
            CancelLeadInfo.fromJS({
                leadId: this.getEntityId(entity),
                cancellationReasonId: data.reasonId,
                comment: data.comment
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete(data);
        })).subscribe((result) => {
            this.completeEntityUpdate(entity, data.fromStage, data.toStage);
        });
    }

    updateOrderStage(fromStage, toStage, entity, complete) {
        this._orderService.updateStage(
            UpdateOrderStageInfo.fromJS({
                orderId: this.getEntityId(entity),
                stageId: toStage.id,
                sortOrder: entity.SortOrder
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe((res) => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    processOrder(fromStage, toStage, entity, complete) {
        let model: ProcessOrderInfo = new ProcessOrderInfo();
        model.id = this.getEntityId(entity);
        model.sortOrder = entity.SortOrder;
        this._orderService.process(
            model
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete();
        })).subscribe((res) => {
            this.completeEntityUpdate(entity, fromStage, toStage);
        });
    }

    cancelOrder(fromStage, toStage, entity, complete) {
        if (entity.data)
            this.cancelOrderInternal(entity, {...entity.data, fromStage, toStage}, complete);
        else
            this._dialog.open(EntityCancelDialogComponent, {
                data: {}
            }).afterClosed().subscribe(data => {
                if (data)
                    this.cancelOrderInternal(entity, {...data, fromStage, toStage}, complete);
                else {
                    this.moveEntityTo(entity, toStage, fromStage);
                    complete && complete();
                }
            });
    }

    private cancelOrderInternal(entity, data, complete) {
        this._orderService.cancel(
            CancelOrderInfo.fromJS({
                orderId: this.getEntityId(entity),
                comment: data.comment
            })
        ).pipe(finalize(() => {
            entity.locked = false;
            complete && complete(data);
        })).subscribe((result) => {
            this.completeEntityUpdate(entity, data.fromStage, data.toStage);
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

    getPrevEntity(entity, entities) {
        for (let i = 0; i < entities.length ; i++) {
            if (entities[i].Id == entity.Id)
                return entities[i - 1];
        }
    }

    getEntityNewSortOrder(entity, stage) {
        let entities = stage['entities'];
        if (entity) {
            let prevEntity = this.getPrevEntity(entity, entities);
            return entities.length > 1 ? prevEntity && prevEntity.SortOrder
                || entities[0].SortOrder + 1 : 0;
        } else
            return entities.length && entities.slice(-1).pop().SortOrder || 0;
    }

    updateEntitySortOrder(pipelineId, entity, complete) {
        if (!entity.locked) {
            entity.locked = true;
            this._pipelineServiceProxy.updateEntitySortOrder(
                pipelineId, entity.Id, entity.SortOrder
            ).pipe(finalize(() => {
                entity.locked = false;
            })).subscribe(complete, complete);
        } else
            complete && complete();
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
