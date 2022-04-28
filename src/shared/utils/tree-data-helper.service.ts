import { Injectable } from '@angular/core';
import filter from 'lodash/filter';
import forEach from 'lodash/forEach';

@Injectable()
export class TreeDataHelperService {
    findNode(data, selector): any {
        let nodes = filter(data, selector);
        if (nodes && nodes.length === 1) {
            return nodes[0];
        }

        let foundNode = null;

        forEach(data, (d) => {
            if (!foundNode) {
                foundNode = this.findNode(d.children, selector);
            }
        });

        return foundNode;
    }

    findParent(data, nodeSelector) {
        let node = this.findNode(data, nodeSelector);
        if (!node) {
            return null;
        }

        return node.parent;
    }

    findChildren(data, selector) {
        let traverseChildren = function (node) {
            let names = [];
            if (node.children) {
                forEach(node.children, (c) => {
                    names.push(c.data.name);
                    names = names.concat(traverseChildren(c));
                });
            }
            return names;
        };

        let foundNode = this.findNode(data, selector);
        if (foundNode) {
            return traverseChildren(foundNode);
        } else {
            return [];
        }
    }
}
