/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SettingsNewComponent } from './settings.new.component';
import { mainNavigation } from './settings.navigation';
import { DashboardSettingComponent } from '../shared/dashboard-settings/dashboard-settings.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {path: '', redirectTo: '/app/admin/settings/dashboard', pathMatch: 'full'},
            {
                path: '',
                component: SettingsNewComponent,
                children: [
                    { path: 'dashboard', component: DashboardSettingComponent },
                    ...mainNavigation.reduce((acc, item) => {
                        let copy  = [];
                        if (item.submenu) {
                            copy.push({ path: item.path, redirectTo: '/app/admin/settings/' + item.submenu[0].path, pathMatch: 'full' })
                            if (['email', 'ai'].includes(item.id)) copy.push({ path: item.path + '/:id', component: item.component })
                            else
                                item.submenu.map(sub => {
                                    if (sub.submenu) {
                                        copy.push({ path: sub.path, redirectTo: '/app/admin/settings/' + sub.submenu[0].path, pathMatch: 'full' })
                                        sub.submenu.map(subsub => {
                                            copy.push({ path: subsub.path, component: subsub.component })
                                        })
                                        return;
                                    }
                                    copy.push({ path: sub.path, component: sub.component })
                                })
                            return acc.concat(copy);
                        }
                        return acc.concat({ path: item.path, component: item.component });
                    }, [])
                ]
            },
        ])
    ],
    exports: [ RouterModule ],
    providers: [  ]
})
export class SettingsRoutingModule {}