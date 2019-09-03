import { Injectable, Injector } from '@angular/core';
import { AppServiceBase } from '@shared/common/app-service-base';
import { CfoConfig } from '@root/mobile/cfo/cfo.config';

@Injectable()
export class AppService extends AppServiceBase {

    constructor(injector: Injector) {
        super(
            injector,
            'CFO',
            [
                {
                    name: 'CFO',
                    showDescription: true
                }
            ],
            {
                cfo: CfoConfig
            }
        );
    }



}
