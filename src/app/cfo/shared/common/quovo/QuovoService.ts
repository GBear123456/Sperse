import { OnInit, Injectable } from '@angular/core';


declare const Quovo: any;

@Injectable()
export class QuovoService {
    constructor() {
        jQuery.getScript('https://app.quovo.com/ui.js', () => { });
    }

    getQuovoHandler(token) {
        let handler = Quovo.create({
            token: token,
            search: {
                testInstitutions: true
            },
            onLoad: function () { console.log('loaded'); },
            onAdd: function (err, event) {
                if (!err) {
                    console.log('Connection', event.connection.id, 'added!');
                }
            }
        });

        return handler;
    }

}
