/** Core imports */
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';

/** Third party imports */
import includes from 'lodash/includes';

/** Application imports */
import { HtmlHelper } from '@shared/helpers/HtmlHelper';
import { OrganizationUnitDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';

export interface IOrganizationUnitsTreeComponentData {
    allOrganizationUnits: OrganizationUnitDto[];
    selectedOrganizationUnits: string[];
}

@Component({
    selector: 'organization-units-tree',
    templateUrl: './organization-units-tree.component.html',
    styleUrls: [ './organization-units-tree.component.less' ]
})
export class OrganizationUnitsTreeComponent implements AfterViewInit {
    @Input() set data(data: IOrganizationUnitsTreeComponentData) {
        if (data && (ArrayHelper.dataChanged(this.allOrganizationUnits, data.allOrganizationUnits)
            || ArrayHelper.dataChanged(this.selectedOrganizationUnits, data.selectedOrganizationUnits)
        )) {
            this.allOrganizationUnits = data.allOrganizationUnits;
            this.selectedOrganizationUnits = data.selectedOrganizationUnits;
            this.refreshTree();
        }
    }
    @Output() onSelectedOrganizationUnitsChange: EventEmitter<number[]> = new EventEmitter<number[]>();

    private $tree: JQuery;
    private createdTreeBefore;
    private allOrganizationUnits: OrganizationUnitDto[];
    private selectedOrganizationUnits: string[];

    constructor(
        private element: ElementRef,
        public ls: AppLocalizationService
    ) {}

    ngAfterViewInit(): void {
        this.$tree = $(this.element.nativeElement).find('.organization-unit-tree');
        this.refreshTree();
        this.initFiltering();
    }

    getSelectedOrganizations(): number[] {
        if (!this.$tree || !this.createdTreeBefore) {
            return [];
        }

        let organizationIds = [];

        let selectedOrganizations = this.$tree.jstree('get_selected', true);
        for (let i = 0; i < selectedOrganizations.length; i++) {
            organizationIds.push(selectedOrganizations[i].original.id);
        }

        return organizationIds;
    }

    refreshTree(): void {
        let self = this;

        if (this.createdTreeBefore) {
            this.$tree.jstree('destroy');
        }

        this.createdTreeBefore = false;

        if (!this.allOrganizationUnits || !this.$tree) {
            return;
        }

        let treeData = this.allOrganizationUnits.map(item => (<any>{
            id: item.id,
            parent: item.parentId ? item.parentId : '#',
            code: item.code,
            displayName: item.displayName,
            memberCount: item.memberCount,
            text: HtmlHelper.encodeText(item.displayName) ,
            dto: item,
            state: {
                opened: true,
                selected: includes(self.selectedOrganizationUnits, item.code)
            }
        }));

        this.$tree.jstree({
            'core': {
                data: treeData
            },
            'types': {
                'default': {
                    'icon': 'fa fa-folder m--font-warning'
                },
                'file': {
                    'icon': 'fa fa-file m--font-warning'
                }
            },
            'checkbox': {
                keep_selected_style: false,
                three_state: false,
                cascade: ''
            },
            'search': {
                'show_only_matches': true
            },
            plugins: ['checkbox', 'types', 'search']
        });

        this.createdTreeBefore = true;

        let inTreeChangeEvent = false;

        function selectNodeAndAllParents(node) {
            self.$tree.jstree('select_node', node, true);
            let parent = self.$tree.jstree('get_parent', node);
            if (parent) {
                selectNodeAndAllParents(parent);
            }
        }

        this.$tree.on('changed.jstree', (e, data) => {
            if (!data.node) {
                return;
            }

            let wasInTreeChangeEvent = inTreeChangeEvent;
            if (!wasInTreeChangeEvent) {
                inTreeChangeEvent = true;
            }

            let childrenNodes;

            if (data.node.state.selected) {
                selectNodeAndAllParents(this.$tree.jstree('get_parent', data.node));

                childrenNodes = $.makeArray(this.$tree.jstree('get_node', data.node).children);
                this.$tree.jstree('select_node', childrenNodes);

            } else {
                childrenNodes = $.makeArray(this.$tree.jstree('get_node', data.node).children);
                this.$tree.jstree('deselect_node', childrenNodes);
            }
            this.onSelectedOrganizationUnitsChange.emit(this.getSelectedOrganizations());
            if (!wasInTreeChangeEvent) {
                inTreeChangeEvent = false;
            }
        });
    }

    initFiltering(): void {
        let to = false;
        let self = this;

        $('#OrganizationUnitsTreeFilter').keyup(() => {
            if (to) { (window as any).clearTimeout(to); }
            to = (window as any).setTimeout(() => {
                let v = $('#OrganizationUnitsTreeFilter').val() as string;
                self.$tree.jstree(true).search(v);
            }, 250);
        });
    }
}
