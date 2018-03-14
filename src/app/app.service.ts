import { Injectable, Injector } from '@angular/core';
import { AppServiceBase } from '@shared/common/app-service-base'
import { PanelMenu } from 'app/shared/layout/panel-menu';

@Injectable()
export class AppService extends AppServiceBase {
    public topMenu: PanelMenu;

    public toolbarConfig: any;
    public toolbarIsAdaptive = false;
    public toolbarIsHidden  = false;
    
    public marginLeftEnable: boolean = true;

    public showContactInfoPanel = false;
    public contactInfo: any;

    constructor(injector: Injector) {
        super(
            injector,
            'CRM',
            [
                'Admin',
                'API',
                'CFO',
                'CRM',
                'Cloud',
                'Feeds',
                'Forms',
                'HR',
                'HUB',
                'Slice',
                'Store'
            ],
            {
                admin: require('./admin/module.config.json'),
                api: require('./api/module.config.json'),
                crm: require('./crm/module.config.json'),
                cfo: require('./cfo/module.config.json')
            },
        )
    }

    setContactInfoVisibility(value: boolean) {
        this.showContactInfoPanel = value;
    }
}
