import { Injector } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { DefaultUrlSerializer, UrlTree } from '@angular/router';
import * as _ from 'underscore';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';

export abstract class AppServiceBase {
    private readonly MODULE_DEFAULT: string;

    private _config: Subject<Object>;
    private _subscribers: Array<Subscription> = [];
    private _modules: Array<string>;
    private _configs: { [id: string]: any; };
    _featureChecker: FeatureCheckerService;
    _permissionChecker: PermissionCheckerService;

    public params: any;

    constructor(
        private _injector: Injector,
        defaultModuleName: string,
        moduleNames: Array<string>,
        configs: { [id: string]: any; }
    ) {
        this._featureChecker = _injector.get(FeatureCheckerService);
        this._permissionChecker = _injector.get(PermissionCheckerService);
        this._config = new Subject<Object>();
        this.MODULE_DEFAULT = defaultModuleName;
        this._modules = moduleNames;
        this._configs = configs;
    }

    getModules() {
        return this._modules;
    }

    getModule() {
        let module = (/\/app\/(\w+)\//.exec(location.pathname)
            || [this.MODULE_DEFAULT]).pop().toLowerCase();
        return this.isModuleActive(module) ? module : this.getDefaultModule();
    }

    getModuleParams() {
        return {
            instance: (/\/app\/\w+\/(\w+)\//.exec(location.pathname) || ['']).pop().toLowerCase()
        };
    }

    getDefaultModule() {
        let defaultModule = '';
        this._modules.forEach((module, i) => {
            if (!defaultModule && this.isModuleActive(module)) {
                defaultModule = module;
            }
        });
        return defaultModule;
    }

    getModuleConfig(name: string) {
        return this._configs[name.toLowerCase()];
    }

    isModuleActive(name: string) {
        let config = this._configs[name.toLowerCase()];
        return (config && typeof (config.navigation) == 'object'
            && (!abp.session.tenantId || !config.requiredFeature || this._featureChecker.isEnabled(config.requiredFeature))
            && (!config.requiredPermission || this._permissionChecker.isGranted(config.requiredPermission))
            && (abp.session.tenantId || !config.hostDisabled)
            );
    }

    initModule() {
        this.switchModule(this.getModule(), this.getModuleParams());
    }

    switchModule(name: string, params: {}) {
        let config = _.clone(this._configs[name.toLowerCase()]);
        config.navigation = config.navigation.map((record) => {
            let clone = record.slice(0);
            clone[3] = this.replaceParams(record[3], params);
            if (record[5] && record[5].length) {
                clone[5] = [];
                record[5].forEach((el, i) => {
                    clone[5].push(this.replaceParams(el, params));
                });
            }
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
        let urlObj: UrlTree = new DefaultUrlSerializer().parse(url);
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
