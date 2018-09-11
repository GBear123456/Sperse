import { AbpHttpConfiguration, AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { httpConfiguration } from '@shared/http/httpConfiguration';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from '@node_modules/rxjs';

export class HttpInterceptor extends AbpHttpInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        console.log(req, next);
        return super.intercept(req, next);
    }
}
