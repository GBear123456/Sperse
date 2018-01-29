import { Injectable } from '@angular/core';

@Injectable()
export class StatsService {

    constructor() { }

    /**
     * Replace string negative value like '$-1000' for the string '$(1000)' (with brackets)
     * @param {string} value
     * @return {string}
     */
    replaceMinusWithBrackets(value: string) {
        return value.replace(/\B(?=(\d{3})+\b)/g, ',').replace(/-(.*)/, '($1)');
    }

    getTooltipInfoHtml(data, fields, pointInfo) {
        let html = '';
        let pointDataObject = data.find(item => item.date.toDate().toString() == pointInfo.argument);
        fields.forEach(field => {
            if (pointDataObject[field.name] !== null && pointDataObject[field.name] !== undefined) {
                html += `${field.label} : <span style="float: right; font-family: Lato; margin-left: 10px">${pointDataObject[field.name].toLocaleString('en-EN', {
                    style: 'currency',
                    currency: 'USD'
                })}</span>`;
                if (field.name === 'startingBalance' ||
                    field.name === 'forecastStartingBalance' ||
                    field.name === 'netChange' ||
                    field.name === 'forecastNetChange')
                    html += '<hr style="margin: 5px 0"/>';
                else
                    html += '<br>';
            }
        });
        return html;
    }

}
