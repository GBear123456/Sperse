import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AppService {
	private _config: Subject<Object>;
  private _subscribers: Array<Subscription> = [];
  private _modules = ['Admin', 'API', 'CFO', 'CRM', 'Cloud', 'Feeds', 'Forms', 'HR', 'HUB', 'Slice', 'Store'];
  private _configs = {};

  private readonly MODULE_DEFAULT = 'CRM';

	constructor() {
		this._config = new Subject<Object>();   

    //!!VP should be considered to use lazy loading 
    this._configs = {
      admin: require('./admin/module.config.json'),
      crm: require('./crm/module.config.json'),
      cfo: require('./cfo/module.config.json')
    }
	}

  getModules() {
    return this._modules;
  }

  getModule() {
    let module = (/\/app\/(\w+)\//.exec(location.pathname) 
      || [this.MODULE_DEFAULT]).pop().toLowerCase();
    return this.isModuleActive(module) ? module: this.MODULE_DEFAULT;
  }

  isModuleActive(name: string) {
    return Boolean(this._configs[name.toLowerCase()]);
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