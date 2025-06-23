<<<<<<< HEAD
/** Core imports */
import {
    Component,
    Inject,
    OnInit,
    ViewChild,
    AfterViewInit,
    ElementRef,
    Input,
    Output,
    EventEmitter
} from '@angular/core';

/** Third party imports */
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { IDialogOption } from '@shared/common/dialogs/modal/dialog-option.interface';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ContextMenuItem } from '@shared/common/dialogs/modal/context-menu-item.interface';

@Component({
    selector: 'modal-dialog',
    templateUrl: 'modal-dialog.component.html',
    styleUrls: [
        '../../styles/close-button.less',
        'modal-dialog.component.less'
    ],
    host: {
        '(window:keydown)': 'onKeydown($event)'
    }
})
export class ModalDialogComponent implements OnInit, AfterViewInit {
    @ViewChild('titleComponent') titleComponent: DxTextBoxComponent;
    @ViewChild(DxContextMenuComponent) contextMenu: DxContextMenuComponent;

    @Input() title: string;
    @Input() editTitle = false;
    @Input() titleClearButton = false;
    @Input() placeholder = null;
    @Input() isTitleValid: boolean;
    @Input() buttons: IDialogButton[] = [];
    @Input() options: IDialogOption[];
    @Input() titleLabel: string;
    @Input() checkCloseAllowed: () => Promise<boolean>;
    @Output() onTitleKeyUp: EventEmitter<any> = new EventEmitter<any>();
    @Output() titleChange: EventEmitter<string> = new EventEmitter<string>();
    @Output() onContextItemChanged: EventEmitter<any> = new EventEmitter<any>();
    public slider: any;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ModalDialogComponent>,
        public ls: AppLocalizationService,
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private cacheService: CacheService
    ) {}

    private fork(callback, timeout = 0) {
        setTimeout(callback.bind(this), timeout);
    }

    ngOnInit() {
        this.dialogRef.disableClose = true;
        this.slider = this.elementRef.nativeElement.closest('.slider');
        if (this.slider) {
            this.addClass('hide');
            this.dialogRef.updateSize(this.data && this.data.width, '0px');
            this.dialogRef.updatePosition({
                right: '-100vw'
            });
        }

        const buttonWithContextItems = this.buttons && this.buttons.find((button: IDialogButton) => {
            return this.showContextMenu(button);
        });

        if (buttonWithContextItems) {
            this.contextOptionsInit(buttonWithContextItems);
        }
    }

    ngAfterViewInit() {
        if (this.slider)
            this.fork(() => {
                this.slider.classList.remove('hide');
                this.dialogRef.updateSize(this.data && this.data.width, '100vh');
                this.fork(() => {
                    this.dialogRef.updatePosition({
                        right: '0px'
                    });
                }, 100);
            });
    }

    titleChanged(event) {
        let title = event.element.getElementsByTagName('input')[0].value;
        this.isTitleValid = Boolean(title);
        this.titleChange.emit(title);
    }

    titleKeyUp(event) {
        this.onTitleKeyUp.emit(event.element.getElementsByTagName('input')[0].value);
    }

    startLoading() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
    }

    addClass(className: string) {
        if (this.slider) this.slider.classList.add(className);
    }

    finishLoading() {
        this.loadingService.finishLoading(this.elementRef.nativeElement);
    }

    clear() {
        if (this.titleComponent)
            this.titleComponent.instance.option('value', '');
    }

    close(slide: boolean = false, closeData = null) {
        if (this.checkCloseAllowed)
            this.checkCloseAllowed().then((closeAllowed: boolean) => {
                if (closeAllowed)
                    this.closeInternal(slide, closeData);
            })
        else
            this.closeInternal(slide, closeData);
    }

    closeInternal(slide: boolean = false, closeData = null) {
        if (slide) {
            this.dialogRef.updatePosition({
                right: '-100vw'
            });
            this.fork(() => {
                this.dialogRef.close(closeData);
            }, 300);
        } else
            this.dialogRef.close(closeData);
    }

    onKeydown(event) {
        if (event.key == 'Escape')
            this.close(true);
    }

    contextMenuItemChanged(e, button: IDialogButton) {
        const contextItem = e.addedItems.pop()
            || e.removedItems.pop()
            || button.contextMenu.items[button.contextMenu.defaultIndex];
        let selectedContextItemIndex = 0;
        button.contextMenu.items.forEach((item: ContextMenuItem, index: number) => {
            item.selected = contextItem.text === item.text;
            if (item.selected) {
                selectedContextItemIndex = index;
            }
        });
        button.title = contextItem.text;
        if (button.contextMenu.cacheKey) {
            this.cacheService.set(
                button.contextMenu.cacheKey,
                selectedContextItemIndex.toString()
            );
        }
        this.onContextItemChanged.next(e);
    }

    onContextMenuItemClick(e) {
        e.event.stopPropagation();
        e.event.preventDefault();
    }

    contextOptionsInit(button: IDialogButton) {
        let contextItemIndex = 0;
        if (button.contextMenu.selectedIndex !== undefined) {
            contextItemIndex = button.contextMenu.selectedIndex;
        } else if (button.contextMenu.cacheKey && this.cacheService.exists(button.contextMenu.cacheKey)) {
            contextItemIndex = this.cacheService.get(button.contextMenu.cacheKey);
        } else
            contextItemIndex = button.contextMenu.defaultIndex;
        let buttonItem = button.contextMenu.items[contextItemIndex];
        if (buttonItem.disabled)
            buttonItem = button.contextMenu.items.find(item => !item.disabled);
        if (buttonItem) {
            button.title = buttonItem.text;
            buttonItem.selected = true;
        }
    }

    buttonClick(e, button: IDialogButton) {
        if (e && e.offsetX > e.target.closest('button').offsetWidth - 32 && this.contextMenu)
            return this.contextMenu.instance.option('visible', true);

        button.action(e);
    }

    showContextMenu(button: IDialogButton): boolean {
        return button.contextMenu && !button.contextMenu.hidden;
    }

=======
/** Core imports */
import {
    Component,
    Inject,
    OnInit,
    ViewChild,
    AfterViewInit,
    ElementRef,
    Input,
    Output,
    EventEmitter
} from '@angular/core';

/** Third party imports */
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { IDialogOption } from '@shared/common/dialogs/modal/dialog-option.interface';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ContextMenuItem } from '@shared/common/dialogs/modal/context-menu-item.interface';

@Component({
    selector: 'modal-dialog',
    templateUrl: 'modal-dialog.component.html',
    styleUrls: [
        '../../styles/close-button.less',
        'modal-dialog.component.less'
    ],
    host: {
        '(window:keydown)': 'onKeydown($event)'
    }
})
export class ModalDialogComponent implements OnInit, AfterViewInit {
    @ViewChild('titleComponent') titleComponent: DxTextBoxComponent;
    @ViewChild(DxContextMenuComponent) contextMenu: DxContextMenuComponent;

    @Input() title: string;
    @Input() editTitle = false;
    @Input() titleClearButton = false;
    @Input() placeholder = null;
    @Input() isTitleValid: boolean;
    @Input() buttons: IDialogButton[] = [];
    @Input() options: IDialogOption[];
    @Input() titleLabel: string;
    @Input() checkCloseAllowed: () => Promise<boolean>;
    @Output() onTitleKeyUp: EventEmitter<any> = new EventEmitter<any>();
    @Output() titleChange: EventEmitter<string> = new EventEmitter<string>();
    @Output() onContextItemChanged: EventEmitter<any> = new EventEmitter<any>();
    public slider: any;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ModalDialogComponent>,
        public ls: AppLocalizationService,
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private cacheService: CacheService
    ) {}

    private fork(callback, timeout = 0) {
        setTimeout(callback.bind(this), timeout);
    }

    ngOnInit() {
        this.dialogRef.disableClose = true;
        this.slider = this.elementRef.nativeElement.closest('.slider');
        if (this.slider) {
            this.addClass('hide');
            this.dialogRef.updateSize(this.data && this.data.width, '0px');
            this.dialogRef.updatePosition({
                right: '-100vw'
            });
        }

        const buttonWithContextItems = this.buttons && this.buttons.find((button: IDialogButton) => {
            return this.showContextMenu(button);
        });

        if (buttonWithContextItems) {
            this.contextOptionsInit(buttonWithContextItems);
        }
    }

    ngAfterViewInit() {
        if (this.slider)
            this.fork(() => {
                this.slider.classList.remove('hide');
                this.dialogRef.updateSize(this.data && this.data.width, '100vh');
                this.fork(() => {
                    this.dialogRef.updatePosition({
                        right: '0px'
                    });
                }, 100);
            });
    }

    titleChanged(event) {
        let title = event.element.getElementsByTagName('input')[0].value;
        this.isTitleValid = Boolean(title);
        this.titleChange.emit(title);
    }

    titleKeyUp(event) {
        this.onTitleKeyUp.emit(event.element.getElementsByTagName('input')[0].value);
    }

    startLoading() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
    }

    addClass(className: string) {
        if (this.slider) this.slider.classList.add(className);
    }

    finishLoading() {
        this.loadingService.finishLoading(this.elementRef.nativeElement);
    }

    clear() {
        if (this.titleComponent)
            this.titleComponent.instance.option('value', '');
    }

    close(slide: boolean = false, closeData = null) {
        if (this.checkCloseAllowed)
            this.checkCloseAllowed().then((closeAllowed: boolean) => {
                if (closeAllowed)
                    this.closeInternal(slide, closeData);
            })
        else
            this.closeInternal(slide, closeData);
    }

    closeInternal(slide: boolean = false, closeData = null) {
        if (slide) {
            this.dialogRef.updatePosition({
                right: '-100vw'
            });
            this.fork(() => {
                this.dialogRef.close(closeData);
            }, 300);
        } else
            this.dialogRef.close(closeData);
    }

    onKeydown(event) {
        if (event.key == 'Escape')
            this.close(true);
    }

    contextMenuItemChanged(e, button: IDialogButton) {
        const contextItem = e.addedItems.pop()
            || e.removedItems.pop()
            || button.contextMenu.items[button.contextMenu.defaultIndex];
        let selectedContextItemIndex = 0;
        button.contextMenu.items.forEach((item: ContextMenuItem, index: number) => {
            item.selected = contextItem.text === item.text;
            if (item.selected) {
                selectedContextItemIndex = index;
            }
        });
        button.title = contextItem.text;
        if (button.contextMenu.cacheKey) {
            this.cacheService.set(
                button.contextMenu.cacheKey,
                selectedContextItemIndex.toString()
            );
        }
        this.onContextItemChanged.next(e);
    }

    onContextMenuItemClick(e) {
        e.event.stopPropagation();
        e.event.preventDefault();
    }

    contextOptionsInit(button: IDialogButton) {
        let contextItemIndex = 0;
        if (button.contextMenu.selectedIndex !== undefined) {
            contextItemIndex = button.contextMenu.selectedIndex;
        } else if (button.contextMenu.cacheKey && this.cacheService.exists(button.contextMenu.cacheKey)) {
            contextItemIndex = this.cacheService.get(button.contextMenu.cacheKey);
        } else
            contextItemIndex = button.contextMenu.defaultIndex;
        let buttonItem = button.contextMenu.items[contextItemIndex];
        if (buttonItem.disabled)
            buttonItem = button.contextMenu.items.find(item => !item.disabled);
        if (buttonItem) {
            button.title = buttonItem.text;
            buttonItem.selected = true;
        }
    }

    buttonClick(e, button: IDialogButton) {
        if (e && e.offsetX > e.target.closest('button').offsetWidth - 32 && this.contextMenu)
            return this.contextMenu.instance.option('visible', true);

        button.action(e);
    }

    showContextMenu(button: IDialogButton): boolean {
        return button.contextMenu && !button.contextMenu.hidden;
    }

>>>>>>> f999b481882149d107812286d0979872df712626
}