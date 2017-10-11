import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AppService {
	private _config: Subject<Object>;
  private _subscribers: Array<Subscription> = [];

  private readonly MODULE_DEFAULT = 'CRM';

	constructor() {
		this._config = new Subject<Object>();    
	}

  getModules() {
    return ['API', 'CFO', 'CRM', 'Cloud', 'Feeds', 'Forms', 'HR', 'HUB', 'Slice', 'Store'];
  }

  getModule() {
    let module = (/\/app\/(\w+)\//.exec(location.pathname) || [this.MODULE_DEFAULT]).pop();
    return this.getModules().indexOf(module) >= 0 ? module: this.MODULE_DEFAULT;
  }

  initModule() {
    this.switchModule(this.getModule());
  }

	switchModule(name: string) {
		this._config.next(require('./' +
      name.toLowerCase() + '/module.config.json'
    ));
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