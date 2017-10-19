import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AppService {
	private _config: Subject<Object>;
  private _subscribers: Array<Subscription> = [];
  private _modules = ['API', 'CFO', 'CRM', 'Cloud', 'Feeds', 'Forms', 'HR', 'HUB', 'Slice', 'Store'];
  private _configs = {};

  private readonly MODULE_DEFAULT = 'CRM';

	constructor() {
		this._config = new Subject<Object>();

    //!!VP should be considered to use lazy loading
    this._configs['CRM'] = require('./crm/module.config.json');
    this._configs['CFO'] = require('./cfo/module.config.json');
/*
    ['CRM', 'CFO'].forEach((name) => {
      this._configs[name] = require('./' +
        name.toLowerCase() + '/module.config.json');
    });
*/
	}

  getModules() {
    return this._modules;
  }

  getModule() {
    let module = (/\/app\/(\w+)\//.exec(location.pathname) || [this.MODULE_DEFAULT]).pop();
    return this.getModules().indexOf(module.toUpperCase()) >= 0 ? module.toUpperCase(): this.MODULE_DEFAULT;
  }

  initModule() {
    this.switchModule(this.getModule());
  }

	switchModule(name: string) {
    this._config.next(this._configs[name]);
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
