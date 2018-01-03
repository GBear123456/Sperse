import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class SetupService {
    private _config: Subject<Object>;
    private _subscribers: Array<Subscription> = [];
    private _modules = ['CFO'];

    private _configs = {
        cfo: require('./cfo/module.config.json')
    };

    private readonly MODULE_DEFAULT = 'CFO';

    public toolbarConfig: any;

    constructor() {
        this._config = new Subject<Object>();
    }

    getModules() {
        return this._modules;
    }

    getModule() {
        let module = (/\/setup\/(\w+)\//.exec(location.pathname)
            || [this.MODULE_DEFAULT]).pop().toLowerCase();
        return this.isModuleActive(module) ? module : this.MODULE_DEFAULT;
    }

    getModuleConfig(name: string) {
        return this._configs[name.toLowerCase()];
    }

    isModuleActive(name: string) {
        let config = this._configs[name.toLowerCase()];
        return (config && typeof(config.navigation) == 'object');
    }

    initModule() {
        this.switchModule(this.getModule());
    }

    switchModule(name: string) {
        this._config.next(this._configs[name.toLowerCase()]);
    }

    subscribeModuleChange(callback: (config: Object) => any) {
        this._subscribers.push(
            this._config.asObservable().subscribe(callback)
        );
    }

    unsubscribe() {
        this._subscribers.map((sub) => {
            return void(sub.unsubscribe());
        });
        this._subscribers.length = 0;
    }
}
