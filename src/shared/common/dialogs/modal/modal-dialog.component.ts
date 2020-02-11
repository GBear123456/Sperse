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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { IDialogOption } from '@shared/common/dialogs/modal/dialog-option.interface';
import { LoadingService } from '@shared/common/loading-service/loading.service';

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
    @ViewChild('titleComponent', { static: true }) titleComponent: DxTextBoxComponent;

    @Input() title: string;
    @Input() editTitle = false;
    @Input() titleClearButton = false;
    @Input() placeholder = null;
    @Input() isTitleValid: boolean;
    @Input() buttons: IDialogButton[];
    @Input() options: IDialogOption[];
    @Output() onTitleKeyUp: EventEmitter<any> = new EventEmitter<any>();
    @Output() titleChange: EventEmitter<string> = new EventEmitter<string>();
    public slider: any;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ModalDialogComponent>,
        public ls: AppLocalizationService,
        private elementRef: ElementRef,
        private loadingService: LoadingService
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
}