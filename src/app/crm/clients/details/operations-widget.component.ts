import { Component, OnInit, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { TagsListComponent } from '../../shared/tags-list/tags-list.component';
import { ListsListComponent } from '../../shared/lists-list/lists-list.component';

@Component({
    selector: 'operations-widget',
    templateUrl: './operations-widget.component.html',
    styleUrls: ['./operations-widget.component.less']
})
export class OperationsWidgetComponent implements OnInit {
    @ViewChild(TagsListComponent) tagsComponent: TagsListComponent;
    @ViewChild(ListsListComponent) listsComponent: TagsListComponent;

    @Input() clientId: number;
    @Output() onDelete: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStatus: EventEmitter<any> = new EventEmitter();
    @Output() print: EventEmitter<any> = new EventEmitter();

    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;

    toolbarConfig = [
        {
            location: 'before', items: [
            {name: 'assign'},
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

    toggleLists() {
        this.listsComponent.toggle();
    }

    toggleTags() {
        this.tagsComponent.toggle();
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
