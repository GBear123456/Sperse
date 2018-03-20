import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';

@Component({
    selector: 'operations-widget',
    templateUrl: './operations-widget.component.html',
    styleUrls: ['./operations-widget.component.less']
})
export class OperationsWidgetComponent implements OnInit {
    @Output() onDelete: EventEmitter<any> = new EventEmitter();
    @Output() onUpdateStatus: EventEmitter<any> = new EventEmitter();

    private dataLayoutType: DataLayoutType = DataLayoutType.Pipeline;

    @Output() print: EventEmitter<any> = new EventEmitter();

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
