/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';
import { first } from 'rxjs/operators';
import capitalize from 'underscore.string/capitalize';
import * as _ from 'underscore';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import DevExpress from 'devextreme';

declare const gapi: any;

@Injectable()
export class ExportGoogleSheetService {
    private gAPI: ReplaySubject<any> = new ReplaySubject<any>(1);
    gAPI$: Observable<any> = this.gAPI.asObservable();
    private readonly GoogleSheetMimeType = 'application/vnd.google-apps.spreadsheet';

    constructor() {
        jQuery.getScript('https://apis.google.com/js/api.js', () => {
            gapi.load('client:auth2',
                () => {
                    gapi.client.init({
                        clientId: AppConsts.googleSheetClientId,
                        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4', 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
                    });
                    this.gAPI.next(gapi);
                });
        });
    }

    export(loader: Promise<any>, sheetName: string) {
        this.signIn((gAPI) => loader.then(data => this.createSheet(gAPI, data, sheetName)))
        return loader;
    }

    private signIn(callback: (gAPI, auth) => void) {
        this.gAPI$.pipe(first()).subscribe(gAPI => {
            let auth = gAPI.auth2.getAuthInstance();
            if (auth.isSignedIn.get())
                callback(gAPI, auth);
            else
                auth.signIn().then(
                    () => callback(gAPI, auth),
                    () => abp.ui.clearBusy()
                );
        });
    }

    exportBlob(blob: Blob, sheetName: string) : Promise<any> {
        return new Promise<any>(resolve => {
            this.signIn((_gApi, auth) => {
                this.uploadToGoogleDrive(this.getAuthToken(auth), this.GoogleSheetMimeType, blob, sheetName).then(x => resolve(x));
            });
        });
    }

    private uploadToGoogleDrive(accessToken: string, mimeType: string, blob: Blob, fileName): Promise<any> {
        let fileMetadata = {
            name: fileName,
            mimeType: mimeType
        };

        let form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
        form.append('file', blob);

        return new Promise(resolve => {
            let xhr = new XMLHttpRequest();
            xhr.open('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink');
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.responseType = 'json';
            xhr.onload = () => {
                window.open(xhr.response.webViewLink, '_blank');
                resolve(xhr.response.id);
            };
            xhr.send(form);
        });
    }

    private getAuthToken(auth) {
        return auth.currentUser.get().getAuthResponse().access_token;
    }

    private createSheet(gAPI: any, data: any, sheetName: string) {
        let spreadsheetBody = {
            properties: {
                title: sheetName
            },
            sheets: [
                {
                    properties: {
                        title: capitalize(location.href.split('/').pop()),
                        index: 0,
                        hidden: false,
                        rightToLeft: false,
                    },
                    data: [
                        {
                            rowData: data
                        }
                    ]
                }
            ]
        };

        gAPI.client.sheets.spreadsheets.create({}, spreadsheetBody).then(response => {
            window.open(response.result.spreadsheetUrl, '_blank');
        }, reason => {
            console.error('error: ' + reason.result.error.message);
        });
    }

    getHeaderRows(visibleColumns) {
        let headerRow = { values: [] };
        _.each(visibleColumns, (col: any) => {
            if (col.allowExporting) {
                headerRow.values.push({
                    userEnteredFormat: {
                        horizontalAlignment: 'CENTER',
                        verticalAlignment: 'MIDDLE',
                        textFormat: {
                            bold: true
                        }
                    },
                    userEnteredValue: {
                        stringValue: col.caption
                    }
                });
            }
        });
        return [headerRow];
    }

    getSerial(date: Date) {
        let returnDateTime = 25569.0 + ((date.getTime() - (date.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24));
        return returnDateTime;
    }

    getCellData(value: any, col: DevExpress.ui.dxDataGridColumn) {
        let cellData = {
            userEnteredFormat: {
                horizontalAlignment: col.fixedPosition || 'LEFT',
                verticalAlignment: 'MIDDLE',
                //wrapStrategy:'LEGACY_WRAP',
                numberFormat: {}
            },
            userEnteredValue: {}
        };

        if (typeof value == 'number') {
            cellData.userEnteredValue['numberValue'] = value;
            if (col.format) {
                if (col.format['type'] && col.format['type'] === 'currency') {
                    cellData.userEnteredFormat.numberFormat['type'] = 'CURRENCY';
                } else if (col.format === 'percent') {
                    cellData.userEnteredFormat.numberFormat['type'] = 'PERCENT';
                }
            }
        } else if (typeof (value) == 'boolean') {
            cellData.userEnteredValue['boolValue'] = value;
        } else if (value instanceof Date) {
            cellData.userEnteredValue['numberValue'] = this.getSerial(value);
            cellData.userEnteredFormat.numberFormat['type'] =
                (col.dataType == 'date' ? 'DATE' : 'DATE_TIME');
        } else {
            cellData.userEnteredValue['stringValue'] = value;
        }
        return cellData;
    }
}