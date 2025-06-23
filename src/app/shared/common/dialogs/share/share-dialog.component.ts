<<<<<<< HEAD
/** Core imports */
import { Component, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppLocalizationService } from '../../localization/app-localization.service';

@Component({
    selector: 'share-dialog',
    templateUrl: 'share-dialog.component.html',
    styleUrls: ['share-dialog.component.less']
})
export class ShareDialogComponent {
    public data: any;
    public dialogRef: MatDialogRef<ShareDialogComponent, any>;
    public ls: AppLocalizationService;
    private clipboardService: ClipboardService;
    btnColor: string = '#1a4f7b';
    btnCaption = 'Share';

    constructor(
        injector: Injector
    ) {
        this.data = injector.get(MAT_DIALOG_DATA);
        this.ls = injector.get(AppLocalizationService);
        this.dialogRef = <any>injector.get(MatDialogRef);
        this.clipboardService = injector.get(ClipboardService);
    }

    getLink() {
        return '<a target="_blank" href="' + this.data.linkUrl + '">' + this.btnCaption + '</a>';
    }

    getFrame() {
        return '<iframe src="' + this.data.linkUrl + '" scrolling="yes" frameborder="0" marginheight="0" marginwidth="0" style="width: 100%; height: 100%;"></iframe>';
    }

    getButton() {
        return '<button onclick="window.open(\'' + this.data.linkUrl + '\')" role="button" style="outline: none;cursor: pointer;border: none;background-color: ' + this.btnColor + ';color: white;border-radius: 5px;padding: 15px 35px;font-family: Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;font-weight: 500;text-decoration: none;font-size: 18px;white-space: nowrap;cursor: pointer;">' + this.btnCaption + '</button>';
    }

    copyToClipbord(data) {
        this.clipboardService.copyFromContent(data);
        abp.notify.info(this.ls.l('SavedToClipboard'));
        this.dialogRef.close();
    }
}
=======
/** Core imports */
import { Component, Injector } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppLocalizationService } from '../../localization/app-localization.service';

@Component({
    selector: 'share-dialog',
    templateUrl: 'share-dialog.component.html',
    styleUrls: ['share-dialog.component.less']
})
export class ShareDialogComponent {
    public data: any;
    public dialogRef: MatDialogRef<ShareDialogComponent, any>;
    public ls: AppLocalizationService;
    private clipboardService: ClipboardService;
    btnColor: string = '#1a4f7b';
    btnCaption = 'Share';

    constructor(
        injector: Injector
    ) {
        this.data = injector.get(MAT_DIALOG_DATA);
        this.ls = injector.get(AppLocalizationService);
        this.dialogRef = <any>injector.get(MatDialogRef);
        this.clipboardService = injector.get(ClipboardService);
    }

    getLink() {
        return '<a target="_blank" href="' + this.data.linkUrl + '">' + this.btnCaption + '</a>';
    }

    getFrame() {
        return '<iframe src="' + this.data.linkUrl + '" scrolling="yes" frameborder="0" marginheight="0" marginwidth="0" style="width: 100%; height: 100%;"></iframe>';
    }

    getButton() {
        return '<button onclick="window.open(\'' + this.data.linkUrl + '\')" role="button" style="outline: none;cursor: pointer;border: none;background-color: ' + this.btnColor + ';color: white;border-radius: 5px;padding: 15px 35px;font-family: Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;font-weight: 500;text-decoration: none;font-size: 18px;white-space: nowrap;cursor: pointer;">' + this.btnCaption + '</button>';
    }

    copyToClipbord(data) {
        this.clipboardService.copyFromContent(data);
        abp.notify.info(this.ls.l('SavedToClipboard'));
        this.dialogRef.close();
    }
}
>>>>>>> f999b481882149d107812286d0979872df712626
