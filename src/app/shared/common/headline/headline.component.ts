/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    Output,
    OnInit,
    OnDestroy
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

/** Application imports */
import { HeadLineConfigModel } from './headline.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppService } from '@app/app.service';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

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
    @Output() onReload: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleToolbar: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleCompactView: EventEmitter<null> = new EventEmitter<null>();
    @Output() onToggleFullScreen: EventEmitter<null> = new EventEmitter<null>();
    @HostBinding('class.fullscreen') isFullScreenMode = false;
    data: HeadLineConfigModel;
    showHeadlineButtons = false;
    toolbarMenuToggleButtonText$: Observable<string> = this.appService.toolbarIsHidden$.pipe(
        map(toolbarIsHidden => toolbarIsHidden ? this.ls.l('ShowToolbarMenu') : this.ls.l('HideToolbarMenu'))
    );
    showCompactView = false;
    fullScreenButtonText$ = this.fullScreenService.isFullScreenMode$.pipe(
        map((isFullScreenMode: boolean) => {
            return isFullScreenMode ? this.ls.l('CloseFullScreenMode') : this.ls.l('OpenPageInFullScreen');
        })
    );

    constructor(
        private appService: AppService,
        private fullScreenService: FullScreenService,
        private lifecycleService: LifecycleSubjectsService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.fullScreenService.isFullScreenMode$
            .pipe(takeUntil(this.lifecycleService.destroy$))
            .subscribe((isFullScreenMode: boolean) => {
                this.isFullScreenMode = isFullScreenMode;
            });
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event) {
        if (this.showHeadlineButtons && !event.target.closest('.headline-buttons .buttons') && !event.target.closest('.headline-buttons .toggle-button')) {
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

    ngOnDestroy() {
        this.lifecycleService.destroy.next();
    }
}
