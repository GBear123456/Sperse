import { Component, OnInit, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { TagsListComponent } from '../../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../../shared/lists-list/lists-list.component';
import { UserAssignmentComponent } from '../../shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '../../shared/rating/rating.component';
import { StarsListComponent } from '../../shared/stars-list/stars-list.component';
import { CustomerInfoDto } from '@shared/service-proxies/service-proxies';
import { ClientDetailsService } from './client-details.service';

@Component({
    selector: 'operations-widget',
    templateUrl: './operations-widget.component.html',
    styleUrls: ['./operations-widget.component.less']
})
export class OperationsWidgetComponent implements OnInit {
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: TagsListComponent;
    @ViewChild(UserAssignmentComponent) userAssignmentComponent: UserAssignmentComponent;
    @ViewChild(RatingComponent) ratingComponent: RatingComponent;
    @ViewChild(StarsListComponent) starsListComponent: StarsListComponent;

    @Input() customerInfo: CustomerInfoDto;
    @Input() clientId: number;
    @Input() leadId: number;
    @Output() onDelete: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStatus: EventEmitter<any> = new EventEmitter();
    @Output() print: EventEmitter<any> = new EventEmitter();

    private _stages: any[] = [];

    get stages(): any[] {
        return this._stages;
    }

    @Input()
    set stages(stages: any[]) {
        this._stages = stages;
        this.initToolbarConfig();
    }

    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;

    toolbarConfig = [];

    initToolbarConfig(config = null) {
        this.toolbarConfig = config || [
            {
                location: 'before', items: [
                {
                    name: 'assign',
                    action: this.toggleUserAssignment.bind(this)
                },
                this.leadId ? {
                    widget: 'dxDropDownMenu',
                    disabled: !this.stages.length,
                    name: 'stage',
                    options: {
                        hint: 'Stage',
                        items: this.stages
                    }
                } :
                {
                    name: 'status',
                    widget: 'dxDropDownMenu',
                    options: {
                        hint: 'Status',
                        items: [
                            {
                                action: this.updateStatus.bind(this, 'A'),
                                text: 'Active',
                            }, {
                                action: this.updateStatus.bind(this, 'I'),
                                text: 'Inactive',
                            }
                        ]
                    }
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
            ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'print',
                        action: this.print.emit.bind(this.print)
                    }
                ]
            }
        ];

        if (this.leadId) {
            this.toolbarConfig[1]['items'].push({
                name: 'delete',
                action: this.delete.bind(this)
            });
        }
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

    constructor(
        private _clientService: ClientDetailsService
    ) { 
        _clientService.toolbarSubscribe((config) => {
            this.initToolbarConfig(config);
        });
    }

    ngOnInit() {
        this.initToolbarConfig();
    }

    delete() {
        this.onDelete.emit();
    }

    updateStatus(statusId: string) {
        this.onUpdateStatus.emit(statusId);
    }

    refresh() {
        this.initToolbarConfig();
    }
}
