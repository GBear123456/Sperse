import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Params } from '@angular/router';
import { NavLink } from '@app/crm/contacts/nav-link.model';

@Component({
    selector: 'item-details-layout',
    templateUrl: './item-details-layout.component.html',
    styleUrls: ['./item-details-layout.component.less']
})
export class ItemDetailsLayoutComponent implements OnInit {
    @Input() navLinks: NavLink[];
    @Input() referrerParams: Params;
    @Input() rightPanelOpened: boolean;
    @Output() onClose: EventEmitter<null> = new EventEmitter<null>();
    @Output() onChanged: EventEmitter<NavLink> = new EventEmitter<NavLink>();

    rightSideVisible;
    @HostListener('window:resize') onResize() {
        this.rightSideVisible = innerWidth > 1200;
    }

    ngOnInit() {
        this.onResize();
    }

    close() {
        this.onClose.emit();
    }

    navChanged(navLink: NavLink) {
        this.onChanged.emit(navLink);
    }
}
