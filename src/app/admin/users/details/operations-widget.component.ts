import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'operations-widget',
    templateUrl: './operations-widget.component.html',
    styleUrls: ['./operations-widget.component.less']
})
export class OperationsWidgetComponent implements OnInit {
    @Output() onDelete: EventEmitter<any> = new EventEmitter();

    toolbarConfig = [];

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'delete',
                        action: this.delete.bind(this)
                    }
                ]
            }
        ];
    }

    constructor() { }

    ngOnInit() {
        this.refresh();
    }

    delete() {
        this.onDelete.emit();
    }

    refresh() {
        this.initToolbarConfig();
    }
}
