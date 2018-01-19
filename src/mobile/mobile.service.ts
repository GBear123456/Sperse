import { Injectable } from '@angular/core';
import { AppServiceBase } from '@shared/common/app-service-base'

@Injectable()
export class AppService extends AppServiceBase {
    
    constructor()
    {
        super(
            'CFO',
            ['CFO'],
            {
                cfo: require('./cfo/module.config.json')
            }
        )
    }
  

    
}
