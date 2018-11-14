import { AppConsts } from '@shared/AppConsts';
import { ChangeDetectionStrategy, Component, Inject, Injector, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ImageCropperComponent, CropperSettings, Bounds } from 'ng2-img-cropper';
import { StringHelper } from '@shared/helpers/StringHelper';
import { FormControl, Validators } from '@angular/forms';

@Component({
    selector: 'upload-photo-dialog',
    templateUrl: 'upload-photo-dialog.html',
    styleUrls: ['upload-photo-dialog.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadPhotoDialogComponent extends AppComponentBase implements AfterViewInit {
    @ViewChild('cropper') cropper: ImageCropperComponent;
    @ViewChild('fileUrlInput') fileUrlInput: ElementRef;

    imageData: any = {};
    cropperSettings: CropperSettings;

    croppedWidth: number;
    croppedHeight: number;

    fileUrlFormControl = new FormControl('', [
        Validators.required,
        Validators.pattern(AppConsts.regexPatterns.url)
    ]);

    private thumbData: string;

    constructor(
        injector: Injector,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<UploadPhotoDialogComponent>
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
        this.cropperSettings = this.getCropperSetting();
    }

    ngAfterViewInit() {
        if (this.data.source) {
            let image: any = new Image();
            image.src = this.data.source;
            this.cropper.setImage(image);
        } else {
            let ctx = this.cropper.cropcanvas.nativeElement.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 619, 300);
        }
    }

    getCropperSetting() {
        let setting = new CropperSettings();
        setting.width = 619;
        setting.height = 200;
        setting.croppedWidth = 100;
        setting.croppedHeight = 100;
        setting.canvasWidth = 619;
        setting.canvasHeight = 300;
        setting.minWidth = 115;
        setting.minHeight = 115;
        setting.rounded = false;
        setting.keepAspect = false;
        setting.noFileInput = true;
        setting.preserveSize = true;
        setting.compressRatio = 2;
        setting.minWithRelativeToResolution = true;
        setting.cropperDrawSettings.strokeColor = 'rgba(255,255,255,1)';
        setting.cropperDrawSettings.strokeWidth = 2;
        setting.cropperClass = 'cropper-canvas';

        return setting;
    }

    fileSelected($event) {
        if ($event.target.files.length)
            this.fileDropped({ files: $event.target.files });
    }

    imgResize(): Promise<any> {
        return new Promise((resolve, rejevt) => {
            let image = new Image(),
                canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');

            image.onload = () => {
                canvas.width = AppConsts.thumbWidth;
                canvas.height = canvas.width * (this.croppedHeight / this.croppedWidth);

                let oc = document.createElement('canvas'),
                    octx = oc.getContext('2d');

                oc.width = image.width * 0.9;
                oc.height = image.height * 0.9;
                octx.drawImage(image, 0, 0, oc.width, oc.height);

                octx.drawImage(oc, 0, 0, oc.width * 0.9, oc.height * 0.9);

                ctx.drawImage(oc, 0, 0,
                    oc.width * 0.9, oc.height * 0.9,
                    0, 0, canvas.width, canvas.height);

                this.thumbData = canvas.toDataURL();

                resolve();
            };
            image.src = this.imageData.image;

        });
    }

    onCrop(bounds: Bounds) {
        this.croppedHeight = bounds.bottom - bounds.top;
        this.croppedWidth = bounds.right - bounds.left;
    }

    onSave(event) {
        if (this.data.maxSizeBytes && this.imageData.image) {
            const fileBytes = window.atob(StringHelper.getBase64(this.imageData.image)).length;
            if (fileBytes > this.data.maxSizeBytes) {
                abp.message.error(this.l('ResizedProfilePicture_Warn_SizeLimit', (this.data.maxSizeBytes / 1024).toFixed(2)));
                return;
            }
        }

        this.imgResize().then(() => {
            this.dialogRef.close({
                origImage: this.imageData.image,
                thumImage: this.thumbData
            });
        });
    }

    fileDropped(event) {
        const file = event.files[0];
        if (file.fileEntry)
            file.fileEntry['file'](this.loadFileContent.bind(this));
        else
            this.loadFileContent(file);
    }

    loadFileContent(file) {
        let reader: FileReader = new FileReader();
        let image = new Image();
        reader.onload = (loadEvent: any) => {
            image.src = loadEvent.target.result;
            image.onload = () => {
                this.cropper.setImage(image);
            };
        };
        reader.readAsDataURL(file);
    }

    onPaste() {
        /** Load file only after validation */
        setTimeout(() => this.loadFile(true));
    }

    loadFile(paste = false) {
        /** Load file into the croop */
        if (this.fileUrlFormControl.valid) {
            let image = new Image();
            let request = new XMLHttpRequest();
            request.addEventListener('load', (result: any) => {
                if (result.target.status == 200) {
                    image.src = this.fileUrlFormControl.value;
                    image.onload = () => {
                        this.cropper.setImage(image);
                    };
                /** Do not show error message if user just paste the link - he may want to modify it before loading */
                } else if (!paste) {
                    this.notify.error(result.target.statusText);
                }
            });
            request.open('GET', this.fileUrlFormControl.value, true);
            request.setRequestHeader('Accept', '*/*');
            request.setRequestHeader('Content-Type', 'application/*');
            request.send();
        }
    }
}
