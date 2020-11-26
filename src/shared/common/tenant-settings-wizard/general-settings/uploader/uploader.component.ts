/** Core imports */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Third party imports */
import { NgxFileDropEntry } from 'ngx-file-drop';
import { Observable, Subscriber, of } from 'rxjs';

/** Application import s*/
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { TenantLoginInfoDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'uploader',
    templateUrl: 'uploader.component.html',
    styleUrls: [ 'uploader.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploaderComponent {
    @Input() title: string;
    @Input() documentId: string;
    @Input() documentLink: string;
    @Input() uploadButtonText: string;
    @Input() uploadUrl: string;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    tenant: TenantLoginInfoDto = this.appSession.tenant;
    file: NgxFileDropEntry;

    constructor(
        private appSession: AppSessionService,
        public ls: AppLocalizationService
    ) {}

    fileDropped(files: NgxFileDropEntry[]) {
        if (files.length)
            this.file = files[0];
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
}