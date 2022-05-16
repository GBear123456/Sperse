/** Core imports */
import { Injector } from '@angular/core';
import { DefaultUrlSerializer, UrlTree } from '@angular/router';

/** Third party imports */
import { Subscription, Subject } from 'rxjs';
import camelCase from 'lodash/camelCase';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';
import { Module } from './module.interface';

export abstract class AppServiceBase {
    private readonly MODULE_DEFAULT: string;

    private config: Subject<ConfigInterface> = new Subject<ConfigInterface>();
    private subscribers: Array<Subscription> = [];
    private modules: Array<Module>;
    private configs: { [id: string]: ConfigInterface; };
    featureChecker: FeatureCheckerService;
    permissionChecker: AppPermissionService;

    public params: any;

    constructor(
        injector: Injector,
        defaultModuleName: string,
        modules: Array<Module>,
        configs: { [id: string]: ConfigInterface; }
    ) {
        this.featureChecker = injector.get(FeatureCheckerService);
        this.permissionChecker = injector.get(AppPermissionService);
        this.MODULE_DEFAULT = defaultModuleName;
        this.modules = modules;
        this.configs = configs;
    }

    getModules() {
        return this.modules;
    }

    getModule(): string {
        let module = camelCase(
            (/\/app\/([\w,-]+)[\/$]?/.exec(location.pathname + location.hash) || [this.MODULE_DEFAULT]).pop()
        );
        return this.isModuleActive(module) ? module : this.getDefaultModule();
    }

    getModuleParams() {
        return {
            instance: (/\/app\/\w+\/(\w+)\//.exec(location.pathname) || ['']).pop().toLowerCase()
        };
    }

    getDefaultModule() {
        return camelCase(this.MODULE_DEFAULT);
    }

    getModuleConfig(name: string): ConfigInterface {
        return this.configs[camelCase(name)];
    }

    isModuleActive(name: string) {
        let config: ConfigInterface = this.getModuleConfig(name);
        return (config && typeof (config.navigation) == 'object'
            && (this.isHostTenant || !config.requiredFeature || this.featureChecker.isEnabled(config.requiredFeature))
            && (!config.requiredPermission || this.permissionChecker.isGranted(config.requiredPermission))
        );
    }

    initModule() {
        this.switchModule(this.getModule(), this.getModuleParams());
    }

    switchModule(name: string, params: {}) {
        let config: ConfigInterface = this.getModuleConfig(name);
        if (config) {
            config.navigation = config.navigation.map((record: ConfigNavigation) => {
                let clone = cloneDeep(record);
                clone.route = this.replaceParams(record.route, params);
                if (record.alterRoutes && record.alterRoutes.length) {
                    clone.alterRoutes = [];
                    record.alterRoutes.forEach((el) => {
                        clone.alterRoutes.push(this.replaceParams(el, params));
                    });
                }
                return clone;
            });
            this.params = params;
            this.config.next(config);
        }
    }

    subscribeModuleChange(callback: (config: ConfigInterface) => any) {
        this.subscribers.push(
            this.config.asObservable().subscribe(callback)
        );
    }

    unsubscribe() {
        this.subscribers.map((sub) => {
            return void (sub.unsubscribe());
        });
        this.subscribers.length = 0;
    }

    replaceParams(url: string, params: {}) {
        if (url) {
            let urlObj: UrlTree = new DefaultUrlSerializer().parse(url);
            if (urlObj.root.children.primary) {
                return (url.startsWith('/') ? '' : location.origin) +
                    '/' + urlObj.root.children.primary.segments
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
        }
        return url;
    }

    get isHostTenant() {
        return !abp.session.tenantId;
    }
}