/** Core imports */
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostListener,
    Input,
    Output
} from '@angular/core';

/** Third party imports */
import { map } from 'rxjs/operators';

/** Application imports */
import { HeadLineConfigModel } from './headline.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppService } from '@app/app.service';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { Observable } from '@node_modules/rxjs';

@Component({
    selector: 'app-headline',
    templateUrl: './headline.component.html',
    styleUrls: ['./headline.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeadLineComponent {
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
        public ls: AppLocalizationService
    ) {}

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
}
