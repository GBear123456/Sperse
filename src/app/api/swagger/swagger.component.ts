import { Component, Injector, Inject, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { Router } from '@angular/router';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  templateUrl: './swagger.component.html',
  styleUrls: ['./swagger.component.less']
})
export class SwaggerComponent extends AppComponentBase implements AfterViewInit, OnInit, OnDestroy {
  link: SafeResourceUrl;
  public headlineConfig = { 
    names: [this.l("Interactive API Documentation")], 
    icon: 'magic-wand', 
    buttons: []
  };

  constructor(
    injector: Injector,
    private _router: Router,
    private _sanitizer: DomSanitizer
  ) {
    super(injector);
  }

  ngAfterViewInit(): void {
    this.getRootComponent().overflowHidden(true);
  }

  ngOnInit() {
    this.link = this._sanitizer
      .bypassSecurityTrustResourceUrl(
        AppConsts.remoteServiceBaseUrl +
        '/swagger/index.html?tenantId=' +
        abp.multiTenancy.getTenantIdCookie() +
        '&tokenAuth=' + abp.auth.getToken()
    );
  }

  ngOnDestroy() {
    this.getRootComponent().overflowHidden();
  }
}
