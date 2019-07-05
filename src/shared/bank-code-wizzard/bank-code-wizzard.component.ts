import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import * as $ from 'jquery';

@Component({
    selector: 'app-bank-code-wizzard',
    templateUrl: './bank-code-wizzard.component.html',
    styleUrls: ['./bank-code-wizzard.component.less']
})
export class BankCodeWizzardComponent implements OnInit {
    textForAnylize = '';
    chart: any;
    anylizeResult: any;
    codeResult = [
        'A', 'N', 'B', 'K'
    ];

    constructor(
    ) {
    }

    ngOnInit() {
        drawChart();
    }

    categorizeText(text: string) {
        event.preventDefault();
        const settings = {
            'async': true,
            'crossDomain': true,
            'url': 'https://api.cyrano.ai/bankcode',
            'method': 'POST',
            'headers': {
                'x-api-key': 'Hug3PclOlz2XEFZHmWTb2a88A5hnFiGb32sR64ud',
                'Content-Type': 'application/json'
            },
            'processData': false,
            'data': JSON.stringify({ content: text.replace(/(\r\n|\n|\r)/gm, '') })
        };
        $.ajax(settings)
            .done(function (response) {
                this.anylizeResult = response;
                let scores = [0, 0, 0, 0];
                    for (let i = 0; i < response.dimmensions.length; i++) {
                        switch (response.dimmensions[i].name) {
                            case 'Blueprint':
                                scores[0] = response.dimmensions[i].value;
                                break;
                            case 'Action':
                                scores[1] = response.dimmensions[i].value;
                                break;
                            case 'Nurturing':
                                scores[2] = response.dimmensions[i].value;
                                break;
                            case 'Knowledge':
                                scores[3] = response.dimmensions[i].value;
                                break;
                            default:
                                break;
                        }
                    }
                    drawChart(scores);
                }
            )
            .fail(function (response) {
                console.log(response);
                $('#bankCodeAnalyzer').prop('readonly', false);
                $('#loader').prop('hidden', true);
            }
            );
    }

    onSubmit(event, formData) {
        event.preventDefault();
        const textForAnylize = formData.value.textForAnalise;
        this.categorizeText(textForAnylize);
    }
}

function drawChart(scores = [0, 0, 0, 0]) {
    new Chart(document.getElementById('bankCodeChart'), {
        'type': 'bar',
        'data': {
            'labels': ['Blueprint', 'Action', 'Nurturing', 'Knowledge'],
            'datasets': [{
                'data': scores,
                'label': 'BANK Score',
                'fill': true,
                'backgroundColor': ['#004a81', '#b70000', '#faa000', '#176826']
            }]
        },
        'options': { 'scales': { 'yAxes': [{ 'ticks': { 'beginAtZero': true } }] } }
    });
}
