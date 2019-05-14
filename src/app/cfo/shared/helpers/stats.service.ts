import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
import { CurrencyPipe } from '@angular/common';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';

@Injectable()
export class StatsService {

    constructor(
        private currencyPipe: CurrencyPipe,
        private cfoPreferences: CfoPreferencesService
    ) {}

    /**
     * Replace string negative value like '-$1000' for the string '($1000)' (with brackets)
     * @param {string} value
     * @param {string} currencySymbol
     * @return {string}
     */
    replaceMinusWithBrackets(value: string, currencySymbol: string) {
        return value.replace(/\B(?=(\d{3})+\b)/g, ',').replace(/-(.*)/, '($1)').replace('$', currencySymbol);
    }

    getTooltipInfoHtml(data, fields, pointInfo) {
        let html = '';
        let pointDataObject;

        if (pointInfo.seriesName.indexOf('forecast') != -1) {
            pointDataObject = data.find(item => item.isForecast && item.date.toDate().toString() == pointInfo.argument);
        } else {
            pointDataObject = data.find(item => !item.isForecast && item.date.toDate().toString() == pointInfo.argument);
        }

        moment.tz.setDefault(undefined);
        let date = moment(pointInfo.argument);
        moment.tz.setDefault(abp.timing.timeZoneInfo.iana.timeZoneId);

        html += `<header class="tooltip-header">${date.format('MMM YYYY')}</header>`;
        fields.forEach(field => {
            if (pointDataObject[field.name] !== null &&
                pointDataObject[field.name] !== undefined &&
                field.name !== 'adjustments' &&
                field.name !== 'forecastAdjustments'
            ) {
                if (field.label == 'Starting Balance') {
                    html += `<div class="tooltip-item ${field.label.toLowerCase()}">${field.label} : <span class="tooltip-item-value">
                            ${this.getAmountWithCurrency(pointDataObject[field.name] - pointDataObject[field.name + 'Adjustments'])}</span></div>`;
                } else if (field.name == 'forecastEndingBalance' || field.name == 'endingBalance') {
                    if (pointDataObject['forecastAdjustments'] !== 0 && pointDataObject['forecastAdjustments'] !== undefined ||
                        pointDataObject['adjustments'] !== 0 && pointDataObject['adjustments'] !== undefined
                    ) {
                        html += `<div class="tooltip-item ${field.label.toLowerCase()}"><span style="padding: 0 3px; color: rgb(50, 190, 242); font-weight: bold;">!</span> ${field.label} : <span class="tooltip-item-value">${this.getAmountWithCurrency(pointDataObject[field.name])}</span></div>`;
                    } else {
                        html += `<div class="tooltip-item ${field.label.toLowerCase()}">${field.label} : <span class="tooltip-item-value">${this.getAmountWithCurrency(pointDataObject[field.name])}</span></div>`;
                    }
                } else if ((field.name.indexOf('BalanceAdjustments') < 0) || pointDataObject[field.name]) {
                    html += `<div class="tooltip-item ${field.label.toLowerCase()}">${field.label} : <span class="tooltip-item-value">${this.getAmountWithCurrency(pointDataObject[field.name])}</span></div>`;
                }

                if (field.name === 'forecastStartingBalanceAdjustments' ||
                    field.name === 'netChange' ||
                    field.name === 'startingBalanceAdjustments' ||
                    field.name === 'forecastNetChange'
                )
                    html += '<hr style="margin: 5px 0"/>';
            }
        });
        return html;
    }

    private getAmountWithCurrency(amount: string | number) {
        return this.currencyPipe.transform(amount, this.cfoPreferences.selectedCurrencyId, this.cfoPreferences.selectedCurrencySymbol);
    }
}
