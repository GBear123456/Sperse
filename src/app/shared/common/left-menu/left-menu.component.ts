/** Core imports */
import {
    Component,
    Input,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    HostBinding,
    AfterViewInit,
    Output,
    OnDestroy,
    OnInit,
    EventEmitter
} from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */
import { Subscription, Observable, of } from 'rxjs';

/** Application imports */
import { AppComponentBase } from '@root/shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { LeftMenuItem } from './left-menu-item.interface';
import { LeftMenuService } from '../../../cfo/shared/common/left-menu/left-menu.service';

@Component({
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.less'],
    selector: 'left-menu',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeftMenuComponent implements AfterViewInit, OnDestroy, OnInit {
    @HostBinding('class.collapsed') @Input() collapsed = false;
    @HostBinding('class.mobile') mobile: boolean = AppConsts.isMobile;
    @HostBinding('style.visibility') visibility = 'hidden';
    @Input() selectedItemIndex: number;
    @Input() items: LeftMenuItem[] = [];
    @Input() headerTitle: string;
    @Input() headerLink;
    @Input() showToggleButton = AppConsts.isMobile;
    @Input() navigatePrefix = '';
    @Output() onItemClick: EventEmitter<LeftMenuItem> = new EventEmitter();
    @Output() onToggle: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() collapsedChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    private subscription: Subscription;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private router: Router,
        private leftMenuService: LeftMenuService
    ) {}

    ngOnInit() {
        if (this.showToggleButton) {
            this.subscription = this.leftMenuService.collapsed$
                .subscribe((collapsed: boolean) => {
                    this.collapsed = collapsed;
                    this.collapsedChange.emit(collapsed);
                    this.changeDetectorRef.markForCheck();
                });
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.visibility = 'visible';
            this.changeDetectorRef.markForCheck();
        }, 1000);
    }

    setSelectedIndex(index: number) {
        this.selectedItemIndex = index;
        this.changeDetectorRef.detectChanges();
    }

    onClick(event, elem: LeftMenuItem) {
        if (!elem.disabled) {
            if (elem.onClick) {
                this.selectedItemIndex = this.items.findIndex((item: LeftMenuItem) => item === elem);
                elem.onClick(elem);
                this.changeDetectorRef.detectChanges();
            } else if (elem.component) {
                this.router.navigate([ this.navigatePrefix + elem.component ]);
            }
        }
    }

    addButtonClick(e, elem: LeftMenuItem) {
        this.router.navigate(
            [ this.navigatePrefix + elem.component ],
            { queryParams: { action: 'addNew' }}
        );
        e.stopPropagation();
    }

    toggle() {
        this.leftMenuService.toggle();
        this.onToggle.emit(!this.collapsed);
    }

    itemIsVisible(item: LeftMenuItem): Observable<boolean> {
        return item.visible instanceof Observable ? item.visible : of((!item.hasOwnProperty('visible') || item.visible));
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
