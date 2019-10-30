/** Core imports */
import { Injector } from '@angular/core';
import { DefaultUrlSerializer, UrlTree } from '@angular/router';

/** Third party imports */
import { Subscription, Subject } from 'rxjs';
import camelCase from 'lodash/camelCase';

/** Application imports */
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';

class Module {
    name: string;
    showDescription: boolean;
    showInDropdown?: boolean;
    focusItem?: boolean;
    footerItem?: boolean;
    uri?: string;
    isComingSoon?: boolean;
    isMemberPortal?: boolean;
}

export abstract class AppServiceBase {
    private readonly MODULE_DEFAULT: string;

    private config: Subject<Object> = new Subject<Object>();
    private subscribers: Array<Subscription> = [];
    private modules: Array<Module>;
    private configs: { [id: string]: any; };
    featureChecker: FeatureCheckerService;
    permissionChecker: AppPermissionService;

    public params: any;

    constructor(
        private _injector: Injector,
        defaultModuleName: string,
        modules: Array<Module>,
        configs: { [id: string]: any; }
    ) {
        this.featureChecker = _injector.get(FeatureCheckerService);
        this.permissionChecker = _injector.get(AppPermissionService);
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

    getModuleConfig(name: string) {
        const config = this.configs[camelCase(name)];
        return config && new config();
    }

    isModuleActive(name: string) {
        let config = this.getModuleConfig(name);
        return (config && typeof (config.navigation) == 'object'
            && (this.isHostTenant || !config.requiredFeature || this.featureChecker.isEnabled(config.requiredFeature))
            && (!config.requiredPermission || this.permissionChecker.isGranted(config.requiredPermission))
            && (!this.isHostTenant || !config.hostDisabled)
        );
    }

    initModule() {
        this.switchModule(this.getModule(), this.getModuleParams());
    }

    switchModule(name: string, params: {}) {
        let config = this.getModuleConfig(name);
        if (config) {
            config.navigation = config.navigation.map((record) => {
                let clone = record.slice(0);
                clone[3] = this.replaceParams(record[3], params);
                if (record[5] && record[5].length) {
                    clone[5] = [];
                    record[5].forEach((el) => {
                        clone[5].push(this.replaceParams(el, params));
                    });
                }
                return clone;
            });
            this.params = params;
            this.config.next(config);
        }
    }

    subscribeModuleChange(callback: (config: Object) => any) {
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
        return url;
    }

    get isHostTenant() {
        return !abp.session.tenantId;
    }
}
