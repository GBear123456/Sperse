/** Core imports */
import { AfterViewInit, Component, OnInit } from '@angular/core';

/** Third party imports */
import escape from 'lodash/escape';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { CachingServiceProxy, StringEntityDto, WebLogServiceProxy } from '@shared/service-proxies/service-proxies';
import { FileDownloadService } from '@shared/utils/file-download.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';

@Component({
    templateUrl: './maintenance.component.html',
    styleUrls: [ '../../../shared/metronic/table.less', './maintenance.component.less' ],
    animations: [ appModuleAnimation() ]
})
export class MaintenanceComponent implements OnInit, AfterViewInit {

    loading = false;
    caches: any = null;
    logs: any = '';
    public gridPagerConfig = {
        showPageSizeSelector: true,
        allowedPageSizes: [10, 20, 50, 100],
        showInfo: true,
        visible: true
    };
    public gridPagerConfig = DataGridService.defaultGridPagerConfig;

    constructor(
        private cacheService: CachingServiceProxy,
        private webLogService: WebLogServiceProxy,
        private fileDownloadService: FileDownloadService,
        private notify: NotifyService,
        public ls: AppLocalizationService
    ) {}

    static fixWebLogsPanelHeight(): void {
        const windowHeight = $(window).height();
        const panelHeight = $('.full-height').height();
        const difference = windowHeight - panelHeight;
        const fixedHeight = panelHeight + difference;
        $('.full-height').css('height', (fixedHeight - 350) + 'px');
    }

    ngOnInit(): void {
        this.getCaches();
        this.getWebLogs();
    }

    ngAfterViewInit(): void {
        $(window).bind('resize', () => {
            MaintenanceComponent.fixWebLogsPanelHeight();
        });
    }

    getCaches(): void {
        this.loading = true;
        this.cacheService.getAllCaches()
            .pipe(finalize(() => { this.loading = false; }))
            .subscribe((result) => {
                this.caches = result.items;
            });
    }

    clearCache(cacheName): void {
        const input = new StringEntityDto();
        input.id = cacheName;
        this.cacheService.clearCache(input).subscribe(() => {
            this.notify.success(this.ls.l('CacheSuccessfullyCleared'));
        });
    }

    clearAllCaches(): void {
        this.cacheService.clearAllCaches().subscribe(() => {
            this.notify.success(this.ls.l('AllCachesSuccessfullyCleared'));
        });
    }

    getWebLogs(): void {
        this.webLogService.getLatestWebLogs().subscribe((result) => {
            this.logs = result.latestWebLogLines;
            MaintenanceComponent.fixWebLogsPanelHeight();
        });
    }

    downloadWebLogs = function () {
        this.webLogService.downloadWebLogs().subscribe((result) => {
            this.fileDownloadService.downloadTempFile(result);
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

}
