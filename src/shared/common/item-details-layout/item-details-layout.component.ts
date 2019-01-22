import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Params } from '@angular/router';

@Component({
    selector: 'item-details-layout',
    templateUrl: './item-details-layout.component.html',
    styleUrls: ['./item-details-layout.component.less']
})
export class ItemDetailsLayoutComponent implements OnInit {
    @Input() navLinks: string[];
    @Input() referrerParams: Params;
    @Input() rightPanelOpened: boolean;
    @Output() onClose: EventEmitter<null> = new EventEmitter<null>();
    constructor() { }

    ngOnInit() {
    }

    close() {
        this.onClose.emit();
    }
}
