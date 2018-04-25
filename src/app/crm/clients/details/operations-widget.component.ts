import { Component, OnInit, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { TagsListComponent } from '../../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../../shared/lists-list/lists-list.component';
import { UserAssignmentComponent } from '../../shared/user-assignment-list/user-assignment-list.component';
import { RatingComponent } from '../../shared/rating/rating.component';

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

    @Input() clientId: number;
    @Output() onDelete: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStatus: EventEmitter<any> = new EventEmitter();
    @Output() print: EventEmitter<any> = new EventEmitter();

    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;

    toolbarConfig = [
        {
            location: 'before', items: [
            {
                name: 'assign',
                action: this.toggleUserAssignment.bind(this)
            },
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
                name: 'delete',
                action: this.delete.bind(this)
            }
        ]
        },
        {
            location: 'after',
            areItemsDependent: true,
            items: [
                {name: 'folder'},
                {name: 'pen'}
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

    constructor() { }

    ngOnInit() {
    }

    delete() {
        this.onDelete.emit();
    }

    updateStatus(statusId: string) {
        this.onUpdateStatus.emit(statusId);
    }
}
