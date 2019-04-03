import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
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

    rightSideVisible;
    @HostListener('window:resize') onResize() {
        this.rightSideVisible = innerWidth > 1200;
    }

    constructor() { }

    ngOnInit() {
        this.onResize();
    }

    close() {
        this.onClose.emit();
    }
}
