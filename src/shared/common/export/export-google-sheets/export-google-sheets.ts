import { Injectable, OnInit } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

import { DxDataGridComponent } from 'devextreme-angular';
import { capitalize } from 'underscore.string';
import * as _ from 'underscore';

declare const gapi: any;

@Injectable()
export class ExportGoogleSheetService implements OnInit {

    ngOnInit() {
        jQuery.getScript('https://apis.google.com/js/api.js', () => {
            gapi.load('client:auth2',
                () => {
                    gapi.client.init({
                        clientId: AppConsts.googleSheetClientId,
                        scope: 'https://www.googleapis.com/auth/spreadsheets',
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
                    });
                });
        });
    }

    export(dataGrid: DxDataGridComponent, sheetName: string, exportAllData: boolean) {
        let auth = gapi.auth2.getAuthInstance();
        if (auth.isSignedIn.get()) {
            this.createSheet(dataGrid, sheetName, exportAllData);
        } else {
            let exportService = this;
            auth.signIn().then(function () {
                exportService.createSheet(dataGrid, sheetName, exportAllData);
            });
        }
    }

    createSheet(dataGrid: DxDataGridComponent, sheetName: string, exportAllData: boolean) {
        let visibleColumns = dataGrid.instance.getVisibleColumns();
        let rowData = [];

        rowData.push(this.getHeaderRow(visibleColumns));

        let itemsForExport = exportAllData ?
            dataGrid.instance.getDataSource().items()
            : dataGrid.instance.getSelectedRowsData();

        _.each(itemsForExport, (val: any) => {
            let row = { values: [] };
            _.each(visibleColumns, (col: any) => {
                if (col.allowExporting) {
                    let value = val[col.dataField];

                    row.values.push(this.getCellData(value, col));
                }
            });
            rowData.push(row);
        });

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
                            rowData: rowData
                        }
                    ]
                }
            ]
        };

        let request = gapi.client.sheets.spreadsheets.create({}, spreadsheetBody);
        request.then(function (response) {
            window.open(response.result.spreadsheetUrl, '_blank');
        }, function (reason) {
            console.error('error: ' + reason.result.error.message);
        });
    }

    getSerial(date: Date) {
        let returnDateTime = 25569.0 + ((date.getTime() - (date.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24));
        return returnDateTime;
    }

    getHeaderRow(visibleColumns) {
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
        return headerRow;
    }

    getCellData(value: any, col: any) {
        let cellData = {
            userEnteredFormat: {
                horizontalAlignment: col.fixedPosition || 'LEFT',
                verticalAlignment: 'MIDDLE',
                //wrapStrategy:'LEGACY_WRAP',
                numberFormat: {
                }
            },
            userEnteredValue: {}
        };

        if (typeof (value) == 'number') {
            cellData.userEnteredValue['numberValue'] = value;
        } else if (typeof (value) == 'boolean') {
            cellData.userEnteredValue['boolValue'] = value;
        } else if (value instanceof Date) {
            cellData.userEnteredValue['numberValue'] = this.getSerial(value);
            cellData.userEnteredFormat.numberFormat['type'] = 'DATE_TIME';
        } else {
            cellData.userEnteredValue['stringValue'] = value;
        }
        return cellData;
    }
}
