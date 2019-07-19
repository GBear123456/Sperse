/** Core imports */
import { AfterViewInit, Component, Injector, OnInit } from '@angular/core';

/** Third party imports */
import escape from 'lodash/escape';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CachingServiceProxy, StringEntityDto, WebLogServiceProxy } from '@shared/service-proxies/service-proxies';
import { FileDownloadService } from '@shared/utils/file-download.service';

@Component({
    templateUrl: './maintenance.component.html',
    styleUrls: [ '../../../shared/metronic/table.less', './maintenance.component.less' ],
    animations: [appModuleAnimation()]
})
export class MaintenanceComponent extends AppComponentBase implements OnInit, AfterViewInit {

    loading = false;
    caches: any = null;
    logs: any = '';
    public headlineConfig = {
        names: [this.l('Maintenance')],
        icon: '',
        buttons: []
    };

    constructor(
        injector: Injector,
        private _cacheService: CachingServiceProxy,
        private _webLogService: WebLogServiceProxy,
        private _fileDownloadService: FileDownloadService) {
        super(injector);
    }

    getCaches(): void {
        const self = this;
        self.loading = true;
        self._cacheService.getAllCaches()
            .pipe(finalize(() => { self.loading = false; }))
            .subscribe((result) => {
                self.caches = result.items;
            });
    }

    clearCache(cacheName): void {
        const self = this;
        const input = new StringEntityDto();
        input.id = cacheName;

        self._cacheService.clearCache(input).subscribe(() => {
            self.notify.success(self.l('CacheSuccessfullyCleared'));
        });
    }

    clearAllCaches(): void {
        const self = this;
        self._cacheService.clearAllCaches().subscribe(() => {
            self.notify.success(self.l('AllCachesSuccessfullyCleared'));
        });
    }

    getWebLogs(): void {
        const self = this;
        self._webLogService.getLatestWebLogs().subscribe((result) => {
            self.logs = result.latestWebLogLines;
            self.fixWebLogsPanelHeight();
        });
    }

    downloadWebLogs = function () {
        const self = this;
        self._webLogService.downloadWebLogs().subscribe((result) => {
            self._fileDownloadService.downloadTempFile(result);
        });
    };

    getLogClass(log: string): string {

        if (log.startsWith('DEBUG')) {
            return 'label label-default';
        }

        if (log.startsWith('INFO')) {
            return 'label label-info';
        }

        if (log.startsWith('WARN')) {
            return 'label label-warning';
        }

        if (log.startsWith('ERROR')) {
            return 'label label-danger';
        }

        if (log.startsWith('FATAL')) {
            return 'label label-danger';
        }

        return '';
    }

    getLogType(log: string): string {
        if (log.startsWith('DEBUG')) {
            return 'DEBUG';
        }

        if (log.startsWith('INFO')) {
            return 'INFO';
        }

        if (log.startsWith('WARN')) {
            return 'WARN';
        }

        if (log.startsWith('ERROR')) {
            return 'ERROR';
        }

        if (log.startsWith('FATAL')) {
            return 'FATAL';
        }

        return '';
    }

    getRawLogContent(log: string): string {
        return escape(log)
            .replace('DEBUG', '')
            .replace('INFO', '')
            .replace('WARN', '')
            .replace('ERROR', '')
            .replace('FATAL', '');
    }

    fixWebLogsPanelHeight(): void {
        const windowHeight = $(window).height();
        const panelHeight = $('.full-height').height();
        const difference = windowHeight - panelHeight;
        const fixedHeight = panelHeight + difference;
        $('.full-height').css('height', (fixedHeight - 350) + 'px');
    }

    ngAfterViewInit(): void {
        $(window).bind('resize', () => {
            this.fixWebLogsPanelHeight();
        });
    }

    ngOnInit(): void {
        const self = this;
        self.getCaches();
        self.getWebLogs();
    }
}
