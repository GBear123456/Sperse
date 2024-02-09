/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
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
import {
    NavPosition,
    TenantSettingsServiceProxy,
    AppearanceSettingsEditDto
} from '@shared/service-proxies/service-proxies';
import { AppService } from '@app/app.service';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AppConsts } from '@shared/AppConsts';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppFeatures } from '@shared/AppFeatures';
import { SettingService } from 'abp-ng2-module';

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
    @Input() totalCount: number;
    @Input() totalErrorMsg: string = '';
    @Input() showTotalCount: Boolean;
    @Input() showCompactView = true;
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
    @Input() showStateResetButton = false;
    @Input() toggleButtonPosition: 'left' | 'right' = 'left';
    @Output() onReload: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleToolbar: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleCompactView: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleFullScreen: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleTotals: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleColumnSelector: EventEmitter<null> = new EventEmitter<null>();
    @Output() onPrint: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleLeftMenu: EventEmitter<null> = new EventEmitter<null>();
    @Output() onStateReset: EventEmitter<null> = new EventEmitter<null>();
    @HostBinding('class.fullscreen') isFullScreenMode = false;
    @HostBinding('class.showLeftBar') showLeftBar = this.layoutService.showLeftBar;
    @HostBinding('class.expandedLeftBar') expandedLeftBar = false;

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

    fullScreenButtonText$ = this.fullScreenService.isFullScreenMode$.pipe(
        map((isFullScreenMode: boolean) => {
            return isFullScreenMode ? this.ls.l('CloseFullScreenMode') : this.ls.l('OpenPageInFullScreen');
        })
    );
    showTotals = !AppConsts.isMobile;
    showRefreshButtonSeparately: boolean;
    showHeadlineMenuToggleButton: boolean;
    isAdminCustomizations: boolean = abp.features.isEnabled(AppFeatures.AdminCustomizations);

    constructor(
        injector: Injector,
        private appService: AppService,
        private filtersService: FiltersService,
        private fullScreenService: FullScreenService,
        private lifecycleService: LifecycleSubjectsService,
        private leftMenuService: LeftMenuService,
        private settingsProxy: TenantSettingsServiceProxy,
        public layoutService: LayoutService,
        public ls: AppLocalizationService,
        private settingService: SettingService,
        private changeDetectorRef: ChangeDetectorRef,
        @Inject('toggleButtonPosition') @Optional() toggleButtonPosition: 'left' | 'right',
        @Inject('showToggleLeftMenuButton') @Optional() showToggleLeftMenuButton: boolean
    ) {
        if (toggleButtonPosition) {
            this.toggleButtonPosition = toggleButtonPosition;
        }
        this.showToggleLeftMenuButton = showToggleLeftMenuButton;

        this.layoutService.toggleHeadlineButtonSubject.asObservable().pipe(
            takeUntil(this.lifecycleService.destroy$)
        ).subscribe(() => {
            setTimeout(() => {
                this.toggleHeadlineButtons();
                this.changeDetectorRef.markForCheck();
            }, 100);
        });

        this.layoutService.expandedLeftBarSubject.asObservable().pipe(
            takeUntil(this.lifecycleService.destroy$)
        ).subscribe((val: boolean) => {
            this.expandedLeftBar = val;
            this.changeDetectorRef.markForCheck();
        });
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

        this.showLeftBar = this.layoutService.showLeftBar;
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

    isTotalCountValid() {
        return Number.isInteger(this.totalCount);
    }

    toggleLeftBar() {
        this.layoutService.expandedLeftBarSubject.next(!this.layoutService.expandedLeftBarSubject.value);
    }

    switchNavBar(event) {
        this.settingsProxy.updateAppearanceSettings(new AppearanceSettingsEditDto({
            navPosition: event.value ? NavPosition.Vertical : NavPosition.Horizontal,
            navTextColor: this.settingService.get('App.Appearance.NavTextColor'),
            navBackground: this.settingService.get('App.Appearance.NavBackground')
        })).subscribe(() => {
            abp.message.info(
                this.ls.l('SettingsChangedRefreshPageNotification', this.ls.l('NavigationMenuPosition'))
            ).done(() => window.location.reload());
        });
    }

    ngOnDestroy() {
        this.lifecycleService.destroy.next();
    }
}
