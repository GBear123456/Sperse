/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    ViewChild,
    AfterViewInit
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

/** Third party imports */
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageCropperComponent, CropperSettings, Bounds } from 'ng2-img-cropper';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { StringHelper } from '@shared/helpers/StringHelper';
import { DownloadPictureInput, ProfileServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { NotifyService } from 'abp-ng2-module';
import { UploadPhotoData } from '@app/shared/common/upload-photo-dialog/upload-photo-data.interface';
import { UploadPhotoResult } from '@app/shared/common/upload-photo-dialog/upload-photo-result.interface';

@Component({
    selector: 'upload-photo-dialog',
    templateUrl: 'upload-photo-dialog.html',
    styleUrls: ['upload-photo-dialog.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadPhotoDialogComponent implements AfterViewInit {
    @ViewChild('cropper') cropper: ImageCropperComponent;

    imageData: any = {};
    cropperSettings: CropperSettings = this.getCropperSetting();
    croppedWidth: number;
    croppedHeight: number;
    fileUrlFormControl = new FormControl('', [
        Validators.required,
        Validators.pattern(AppConsts.regexPatterns.url)
    ]);
    clearDisabled = true;
    private thumbData: string;
    title: string = this.data.title;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private profileServiceProxy: ProfileServiceProxy,
        private loadingService: LoadingService,
        private notifyService: NotifyService,
        public dialogRef: MatDialogRef<UploadPhotoDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: UploadPhotoData
    ) {}

    ngAfterViewInit() {
        if (this.data.source) {
            let image: any = new Image();
            image.src = this.data.source;
            image.crossOrigin = 'Anonymous';
            image.onload = () => {
                this.cropper.setImage(image);
                this.clearDisabled = false;
            };
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
        setting.minWidth = 1;
        setting.minHeight = 1;
        setting.rounded = false;
        setting.keepAspect = false;
        setting.noFileInput = true;
        setting.preserveSize = true;
        setting.compressRatio = 2;
        setting.minWithRelativeToResolution = true;
        setting.cropperDrawSettings.strokeColor = 'rgba(0,174,239,1)';
        setting.cropperDrawSettings.strokeWidth = 2;
        setting.cropperClass = 'cropper-canvas';

        return setting;
    }

    fileSelected($event) {
        if ($event.target.files.length)
            this.fileDropped({ files: $event.target.files });
    }

    imgResize(): Promise<void> {
        return new Promise<void>((resolve) => {
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
            image.crossOrigin = 'Anonymous';
        });
    }

    onCrop(bounds: Bounds) {
        this.croppedHeight = bounds.bottom - bounds.top;
        this.croppedWidth = bounds.right - bounds.left;
    }

    onSave() {
        if (this.data.maxSizeBytes && this.imageData.image) {
            const fileBytes = window.atob(StringHelper.getBase64(this.imageData.image)).length;
            if (fileBytes > this.data.maxSizeBytes) {
                abp.message.error(
                    this.ls.l(
                        'ResizedProfilePicture_Warn_SizeLimit',
                        (this.data.maxSizeBytes / 1024).toFixed(2)
                    )
                );
                return;
            }
        }

        this.imgResize().then(() => {
            const uploadPhotoResult: UploadPhotoResult = {
                origImage: this.imageData.image,
                thumbImage: this.thumbData,
                source: this.fileUrlFormControl.value
            };
            this.dialogRef.close(uploadPhotoResult);
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
            image.crossOrigin = 'Anonymous';
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

    clearPhoto() {
        if (!this.clearDisabled) {
            const uploadPhotoResult: UploadPhotoResult = {
                clearPhoto: true,
                origImage: null,
                thumbImage: null
            };
            this.dialogRef.close(uploadPhotoResult);
        }
    }

    loadFile(paste: boolean = false) {
        /** Load file into the croop */
        if (this.fileUrlFormControl.valid) {
            this.loadingService.startLoading();
            let image = new Image();
            image.src = this.fileUrlFormControl.value;
            image.crossOrigin = 'Anonymous';
            image.onload = () => {
                this.cropper.setImage(image);
                this.changeDetectorRef.detectChanges();
                this.loadingService.finishLoading();
            };
            image.onerror = () => {
                if (!paste) {
                    this.profileServiceProxy.downloadPicture(DownloadPictureInput.fromJS({
                        url: this.fileUrlFormControl.value
                    })).subscribe(
                        pictureBase64 => {
                            const image = new Image();
                            image.src = 'data:image/jpeg;base64,' + pictureBase64;
                            image.crossOrigin = 'Anonymous';
                            image.onload = () => {
                                this.cropper.setImage(image);
                                this.changeDetectorRef.detectChanges();
                                this.loadingService.finishLoading();
                            };
                            image.onerror = () => {
                                this.notifyService.error(this.ls.l('PhotoIsNotReachable'));
                                this.loadingService.finishLoading();
                            };
                        },
                        () => this.loadingService.finishLoading()
                    );
                } else
                    this.loadingService.finishLoading();
            };
        }
    }
}
