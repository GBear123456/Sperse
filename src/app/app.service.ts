import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { DefaultUrlSerializer, UrlTree } from '@angular/router';
import * as _ from 'underscore';
import { PanelMenu } from 'app/shared/layout/panel-menu';

@Injectable()
export class AppService {
    private _config: Subject<Object>;
    private _subscribers: Array<Subscription> = [];
    private _modules = ['Admin', 'API', 'CFO', 'CRM', 'Cloud', 'Feeds', 'Forms', 'HR', 'HUB', 'Slice', 'Store'];
    //!!VP should be considered to use lazy loading
    private _configs = {
        admin: require('./admin/module.config.json'),
        api: require('./api/module.config.json'),
        crm: require('./crm/module.config.json'),
        cfo: require('./cfo/module.config.json')
    };

    private readonly MODULE_DEFAULT = 'CRM';

    public topMenu: PanelMenu;

    public toolbarConfig: any;

    public params: any;

    constructor() {
        this._config = new Subject<Object>();
    }

    getModules() {
        return this._modules;
    }

    getModule() {
        let module = (/\/app\/(\w+)\//.exec(location.pathname)
            || [this.MODULE_DEFAULT]).pop().toLowerCase();
        return this.isModuleActive(module) ? module : this.MODULE_DEFAULT;
    }

    getModuleParams() {
        return {
            instance: (/\/app\/\w+\/(\w+)\//.exec(location.pathname) || ['']).pop().toLowerCase()
        }
    }

    getModuleConfig(name: string) {
        return this._configs[name.toLowerCase()];
    }

    isModuleActive(name: string) {
        let config = this._configs[name.toLowerCase()];
        return (config && typeof (config.navigation) == 'object');
    }

    initModule() {
        this.switchModule(this.getModule(), this.getModuleParams());
    }

    switchModule(name: string, params: {}) {
        let config = _.clone(this._configs[name.toLowerCase()]);
        config.navigation = config.navigation.map((record) => {
            let clone = record.slice(0);
            clone[3] = this.replaceParams(record[3], params);
            return clone;
        });
        this.params = params;
        this._config.next(config);
    }

    subscribeModuleChange(callback: (config: Object) => any) {
        this._subscribers.push(
            this._config.asObservable().subscribe(callback)
        );
    }

    unsubscribe() {
        this._subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this._subscribers.length = 0;
    }

    replaceParams(url: string, params: {}) {
        var urlObj: UrlTree = new DefaultUrlSerializer().parse(url);
        if (urlObj.root.children.primary) {
            return '/' + urlObj.root.children.primary.segments
                .map(segment => {
                    let segmentPath = segment.path;
                    if (segmentPath.startsWith(':')) {
                        let replaceParamName = segmentPath.substr(1);
                        let replaceParamValue = params[replaceParamName];
                        if (replaceParamValue) {
                            return replaceParamValue;
                        }
                    }
                    return segmentPath;
                }).join('/');
        }
        return url;
    }
}
