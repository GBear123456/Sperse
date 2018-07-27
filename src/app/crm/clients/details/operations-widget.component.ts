import { Component, OnInit, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { TagsListComponent } from '../../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../../shared/lists-list/lists-list.component';
import { UserAssignmentComponent } from '../../shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '../../shared/rating/rating.component';
import { StarsListComponent } from '../../shared/stars-list/stars-list.component';
import { StaticListComponent } from '../../shared/static-list/static-list.component';
import { CustomerInfoDto } from '@shared/service-proxies/service-proxies';
import { ClientDetailsService } from './client-details.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'operations-widget',
    templateUrl: './operations-widget.component.html',
    styleUrls: ['./operations-widget.component.less'],
    providers: [ AppLocalizationService ]
})
export class OperationsWidgetComponent implements OnInit {
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: TagsListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;
    @ViewChild('stagesList') stagesComponent: StaticListComponent;
    @ViewChild('statusesList') statusComponent: StaticListComponent;

    /*** @todo add localization service */

    @Input() customerInfo: CustomerInfoDto;
    @Input() clientId: number;
    @Input() leadId: number;
    @Input() selectedStageId: number;
    @Input()
    set stages(stages: any[]) {
        this._stages = stages;
        this.initToolbarConfig();
    }
    @Output() onDelete: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStage: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStatus: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateRating: EventEmitter<any> = new EventEmitter();
    @Output() print: EventEmitter<any> = new EventEmitter();

    private _stages: any[] = [];
    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;

    toolbarConfig = [];

    constructor(
        private _clientService: ClientDetailsService,
        public localizationService: AppLocalizationService
    ) {
        _clientService.toolbarSubscribe((config) => {
            this.initToolbarConfig(config);
        });
    }

    ngOnInit() {
        this.initToolbarConfig();
    }

    get stages(): any[] {
        return this._stages;
    }

    initToolbarConfig(config = null) {
        this.toolbarConfig = config || [
            {
                location: 'before', items: [
                {
                    name: 'assign',
                    action: this.toggleUserAssignment.bind(this)
                },
                this.leadId ? {
                    name: 'stage',
                    action: this.toggleStages.bind(this)
                } :
                {
                    name: 'status',
                    action: this.toggleStatus.bind(this)
                },
                {
                    name: 'lists',
                    action: this.toggleLists.bind(this)
                },
                {
                    name: 'tags',
                    action: this.toggleTags.bind(this)
                },
                {
                    name: 'rating',
                    action: this.toggleRating.bind(this),
                },
                {
                    name: 'star',
                    action: this.toggleStars.bind(this),
                }
            ]}, {
                location: 'before', items: [
                    {
                        name: 'print',
                        action: this.print.emit.bind(this.print)
                    },
                    {
                        name: 'delete',
                        action: this.delete.bind(this),
                        visible: Boolean(this.leadId)
                    }
                ]
            }
        ];
    }

    toggleStages() {
        this.stagesComponent.toggle();
    }

    toggleStatus() {
        this.statusComponent.toggle();
    }

    toggleDataLayout(dataLayoutType) {
        this.dataLayoutType = dataLayoutType;
    }

    toggleUserAssignment(dataLayoutType) {
        this.userAssignmentComponent.toggle();
    }

    toggleLists() {
        this.listsComponent.toggle();
    }

    toggleTags() {
        this.tagsComponent.toggle();
    }

    toggleRating() {
        this.ratingComponent.toggle();
    }

    toggleStars() {
        this.starsListComponent.toggle();
    }

    delete() {
        this.onDelete.emit();
    }

    updateStatus(event) {
        this.onUpdateStatus.emit(event);
    }

    updateStage(event) {
        this.onUpdateStage.emit(event);
    }

    updateRating(event) {
        this.onUpdateRating.emit(event);
    }

    refresh() {
        this.stagesComponent.tooltipVisible = false;
        this.initToolbarConfig();
    }
}
