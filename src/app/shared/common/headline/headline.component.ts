﻿/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    Output,
    OnInit,
    OnDestroy,
    Injector,
    Inject,
    Optional
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

/** Application imports */
import { HeadLineConfigModel } from './headline.model';
import { FiltersService } from '@shared/filters/filters.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppService } from '@app/app.service';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppConsts } from '@shared/AppConsts';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';

@Component({
    selector: 'app-headline',
    templateUrl: './headline.component.html',
    styleUrls: ['./headline.component.less'],
    providers: [ LifecycleSubjectsService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeadLineComponent implements OnInit, OnDestroy {
    @Input() reloadIsNecessary = false;
    @Input() names: string[];
    @Input() icon: string;
    @Input() iconSrc: string;
    @Input() text: string;
    @Input() buttons: HeadlineButton[];
    @Input() showReloadButton = false;
    @Input() showToggleToolbarButton = false;
    @Input() showToggleCompactViewButton = false;
    @Input() showToggleFullScreenButton = false;
    @Input() showToggleTotalsButton = false;
    @Input() showToggleColumnSelectorButton = false;
    @Input() showToggleFilterMenuButton = false;
    @Input() showPrintButton = false;
    @Input() showToggleLeftMenuButton = false;
    @Input() toggleButtonPosition: 'left' | 'right' = 'left';
    @Output() onReload: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleToolbar: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleCompactView: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleFullScreen: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleTotals: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleColumnSelector: EventEmitter<null> = new EventEmitter<null>();
    @Output() onPrint: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleLeftMenu: EventEmitter<null> = new EventEmitter<null>();
    @HostBinding('class.fullscreen') isFullScreenMode = false;
    data: HeadLineConfigModel;
    showHeadlineButtons = false;
    toolbarMenuToggleButtonText$: Observable<string> = this.appService.toolbarIsHidden$.pipe(
        map(toolbarIsHidden => toolbarIsHidden ? this.ls.l('ShowToolbarMenu') : this.ls.l('HideToolbarMenu'))
    );
    toggleLeftMenuButtonText$: Observable<string> = this.leftMenuService.collapsed$.pipe(
        map((collapsed: boolean) => collapsed ? this.ls.l('ShowLeftSidebar') : this.ls.l('HideLeftSidebar'))
    );
    toggleLeftMenuButtonIconClass$: Observable<string> = this.leftMenuService.collapsed$.pipe(
        map((collapsed: boolean) => 'dx-icon-' + (collapsed ? 'show' : 'hide') + 'panel')
    );
    toggleFilterMenuButtonText$: Observable<string> = this.filtersService.filterToggle$.pipe(
        map((collapsed: boolean) => this.ls.l((collapsed ? 'Hide' : 'Show') + 'FilterSidebar'))
    );

    showCompactView = false;
    fullScreenButtonText$ = this.fullScreenService.isFullScreenMode$.pipe(
        map((isFullScreenMode: boolean) => {
            return isFullScreenMode ? this.ls.l('CloseFullScreenMode') : this.ls.l('OpenPageInFullScreen');
        })
    );
    showTotals = !AppConsts.isMobile;
    showRefreshButtonSeparately: boolean;
    showHeadlineMenuToggleButton: boolean;

    constructor(
        injector: Injector,
        private appService: AppService,
        private filtersService: FiltersService,
        private fullScreenService: FullScreenService,
        private lifecycleService: LifecycleSubjectsService,
        private leftMenuService: LeftMenuService,
        public ls: AppLocalizationService,
        @Inject('toggleButtonPosition') @Optional() toggleButtonPosition: 'left' | 'right',
        @Inject('showToggleLeftMenuButton') @Optional() showToggleLeftMenuButton: boolean
    ) {
        if (toggleButtonPosition) {
            this.toggleButtonPosition = toggleButtonPosition;
        }
        this.showToggleLeftMenuButton = showToggleLeftMenuButton;
    }

    ngOnInit() {
        this.fullScreenService.isFullScreenMode$
            .pipe(takeUntil(this.lifecycleService.destroy$))
            .subscribe((isFullScreenMode: boolean) => {
                this.isFullScreenMode = isFullScreenMode;
            });
        this.showRefreshButtonSeparately = this.showReloadButton && this.toggleButtonPosition === 'left';
        this.showHeadlineMenuToggleButton = this.showReloadButton && !this.showRefreshButtonSeparately
            || this.showToggleToolbarButton
            || this.showToggleCompactViewButton
            || this.showToggleFullScreenButton
            || this.showToggleColumnSelectorButton
            || this.showPrintButton
            || this.showToggleLeftMenuButton;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event) {
        if (this.showHeadlineButtons && !event.target.closest('.toggle-button-container .buttons') && !event.target.closest('.toggle-button-container .toggle-button')) {
            this.showHeadlineButtons = false;
        }
    }

    toggleHeadlineButtons() {
        this.showHeadlineButtons = !this.showHeadlineButtons;
    }

    reload(e) {
        this.onReload.emit(e);
    }

    toggleToolbar() {
        this.appService.toolbarToggle();
        this.onToggleToolbar.emit();
    }

    toggleCompactView() {
        this.showCompactView = !this.showCompactView;
        this.onToggleCompactView.emit();
    }

    toggleFullScreen() {
        this.fullScreenService.toggleFullscreen(document.documentElement);
        this.onToggleFullScreen.emit();
    }

    toggleColumnSelector() {
        this.onToggleColumnSelector.emit();
    }

    print() {
        this.onPrint.emit();
    }

    toggleLeftMenu() {
        this.leftMenuService.toggle();
        this.onToggleLeftMenu.emit();
    }

    toggleTotals() {
        this.showTotals = !this.showTotals;
        this.onToggleTotals.emit();
    }

    toggleLeftFilterDialog(event) {
        this.filtersService.fixed =
            !this.filtersService.enabled;
        this.filtersService.toggle();
    }

    ngOnDestroy() {
        this.lifecycleService.destroy.next();
    }
}
