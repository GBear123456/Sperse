import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

import { Angular2Csv } from 'angular2-csv/Angular2-csv';

import { capitalize } from 'underscore.string';

@Injectable()
export class ExportService {
  constructor() {}

  getFileName() {
    var date = new Date();
    return capitalize(location.href.split('/').pop()) +
      "_" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() +
      "_" + date.getHours() + "" + date.getMinutes() + "" + date.getSeconds();
  }

  saveAsCSV(data: any, name?: string) {
    setTimeout(() => {
      new Angular2Csv(data, name || this.getFileName());
    });
  }
}