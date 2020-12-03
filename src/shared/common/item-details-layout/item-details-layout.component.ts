import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Params } from '@angular/router';
import { NavLink } from '@app/crm/contacts/nav-link.model';
import { Observable, of } from 'rxjs';

@Component({
    selector: 'item-details-layout',
    templateUrl: './item-details-layout.component.html',
    styleUrls: [
        '../styles/close-button.less',
        './item-details-layout.component.less'
    ]
})
export class ItemDetailsLayoutComponent implements OnInit {
    @Input() navLinks: NavLink[];
    @Input() queryParams: Params;
    @Input() rightPanelOpened: boolean;
    @Input() rightPanelWidth: string;
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

    isVisible(link: NavLink): Observable<boolean> {
        return link.visible$ === undefined ? of(true) : link.visible$;
    }

    getLabel(link: NavLink): Observable<string> {
        return link.label$ ? link.label$ : of(link.label);
    }

    navChanged(navLink: NavLink) {
        this.onChanged.emit(navLink);
    }
}
