import { Injectable, Injector } from '@angular/core';
import { AppServiceBase } from '@shared/common/app-service-base'

@Injectable()
export class AppService extends AppServiceBase {
    
    constructor(injector: Injector)
    {
        super(
            injector,
            'CFO',
            ['CFO'],
            {
                cfo: require('./cfo/module.config.json')
            }
        )
    }
  

    
}
