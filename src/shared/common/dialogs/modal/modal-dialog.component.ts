import {
    Component,
    ChangeDetectionStrategy,
    Inject,
    OnInit,
    AfterViewInit,
    ElementRef,
    Input,
    Output, EventEmitter
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { IDialogOption } from '@shared/common/dialogs/modal/dialog-option.interface';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'modal-dialog',
    templateUrl: 'modal-dialog.component.html',
    styleUrls: ['modal-dialog.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDialogComponent implements OnInit, AfterViewInit {
    @Input() title: string;
    @Input() editTitle = false;
    @Input() titleClearButton = false;
    @Input() placeholder = null;
    @Input() isTitleValid: boolean;
    @Input() buttons: IDialogButton[];
    @Input() options: IDialogOption[];
    @Output() onTitleKeyUp: EventEmitter<any> = new EventEmitter<any>();
    @Output() onTitleChanged: EventEmitter<any> = new EventEmitter<any>();
    private slider: any;

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
            this.slider.classList.add('hide');
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
        this.onTitleChanged.emit(title);
    }

    titleKeyUp(event) {
        this.onTitleKeyUp.emit(event.element.getElementsByTagName('input')[0].value);
    }

    startLoading() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
    }

    finishLoading() {
        this.loadingService.finishLoading(this.elementRef.nativeElement);
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
}
