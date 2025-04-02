/** Core imports */
import { ChangeDetectionStrategy, EventEmitter, Component, Input, Output } from '@angular/core';

/** Third party imports */
import { NgxFileDropEntry } from 'ngx-file-drop';
import { Observable, Subscriber, of } from 'rxjs';
import { MessageService } from 'abp-ng2-module';
import { Download, Info, LucideAngularComponent, Trash2, Upload } from 'lucide-angular';

/** Application import */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { TenantLoginInfoDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'settings-uploader',
    templateUrl: './settings-uploader.component.html',
    styleUrls: [ '/settings-uploader.component.less', '../settings-base.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsUploaderComponent {
    readonly InfoIcon = Info;
    readonly UploadIcon = Upload;
    readonly DownloadIcon = Download;
    readonly TrashIcon = Trash2;

    @Input() title: string;
    @Input() documentId: string;
    @Input() documentLink: string;
    @Input() documentTemplateLink: string;
    @Input() uploadButtonText: string;
    @Input() uploadInfoText: string;
    @Input() uploadUrl: string;
    @Input() acceptFileExt = '.html';
    @Input() maxFileSize: number;
    @Input() showPlusSign: boolean = true;
    @Input() icon: LucideAngularComponent;
    @Input() tooltipDescription: string;
    @Input() iconColor: string;

    @Output() onDocumentClear: EventEmitter<any> = new EventEmitter();
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    file: NgxFileDropEntry;

    constructor(
        private message: MessageService,
        private appSession: AppSessionService,
        public ls: AppLocalizationService
    ) {}

    fileDropped(files: NgxFileDropEntry[]) {
        if (files.length)
            files[0].fileEntry['file']((file: File) => {
                if (this.maxFileSize && file.size > this.maxFileSize)
                    this.message.warn(this.ls.l('File_SizeLimit_Error'));
                else
                    this.file = files[0];
            });
    }

    uploadFile(): Observable<any> {
        return this.file ? this.sendFile(this.file) : of(true);
    }

    sendFile(file: NgxFileDropEntry): Observable<any> {
        return new Observable((subscriber: Subscriber<any>) => {
            file.fileEntry['file']((file: File) => {
                let xhr = new XMLHttpRequest(),
                    formData = new FormData();
                formData.append('file', file);
                xhr.open('POST', this.uploadUrl);
                xhr.setRequestHeader('Authorization', 'Bearer ' + abp.auth.getToken());
                xhr.upload.addEventListener('progress', event => {
                    subscriber.next(event);
                });
                xhr.addEventListener('load', () => {
                    let response = JSON.parse(xhr.responseText);
                    if (xhr.status === 200)
                        subscriber.next(response);
                    else
                        subscriber.error(response);
                    subscriber.complete();
                });
                xhr.send(formData);
            });
        });
    }

    clear() {
        this.file = undefined;
        this.onDocumentClear.emit();
    }
}