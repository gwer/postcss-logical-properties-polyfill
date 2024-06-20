import { PluginCreator, Rule, Declaration } from 'postcss';

import { Direction } from './types';
import { isSupportedProp, transformToNonLogical } from './transformers';

type BuildSelector = (selector: string, direction: Direction) => string;
type PluginOptions = {
    preserve?: boolean;
};

const defaultBuildSelector: BuildSelector = (selector, direction) => {
    let prefix = `html[dir="${direction}"]`;

    return `${prefix} ${selector}`;
};

function generatePolyfills(decls: ReadonlyArray<Declaration>, direction: Direction): Array<Declaration> {
    const newDecls: Array<Declaration> = [];
    decls.forEach((decl) => {
        const newDecl = transformToNonLogical(decl, direction);
        if (!newDecl) {
            return;
        }

        if (Array.isArray(newDecl)) {
            newDecls.push(...newDecl);
        } else {
            newDecls.push(newDecl);
        }
    });

    return newDecls;
}

const plugin: PluginCreator<PluginOptions> = ({ preserve = true }: PluginOptions = {}) => {
    const buildSelector = defaultBuildSelector;
    const modes: Direction[] = ['rtl', 'ltr'];

    return {
        postcssPlugin: 'postcss-old-safari-logical-properties-polyfill',
        Root(root) {
            const rulesToProcess = new Map<Rule, Array<Declaration>>();

            root.walkDecls((decl) => {
                if (!isSupportedProp(decl.prop)) {
                    return;
                }

                const parent = decl.parent as Rule | undefined;
                if (!parent || parent.type !== 'rule') {
                    return;
                }

                // Skip LESS namespaces and mixins, since they must have different behavior
                if (parent.selector.match(/\((\s*|\s*[@].*)\)/)) {
                    return;
                }

                if (rulesToProcess.has(parent)) {
                    rulesToProcess.get(parent)!.push(decl);
                } else {
                    rulesToProcess.set(parent, [decl]);
                }
            });

            for (const [rule, decls] of rulesToProcess) {
                for (const direction of modes) {
                    const declsForDirection = generatePolyfills(decls, direction);
                    if (declsForDirection.length === 0) {
                        continue;
                    }

                    const newRule = rule.clone().removeAll();
                    newRule.selectors = rule.selectors.map((selector) => buildSelector(selector, direction));
                    newRule.append(declsForDirection);

                    if (!newRule.raws.before!.startsWith('\n\n')) {
                        newRule.raws.before = '\n\n' + newRule.raws.before;
                    }

                    rule.after(newRule);
                }

                if (!preserve) {
                    decls.forEach((decl) => decl.remove());
                }
            }
        },
    };
};

plugin.postcss = true;

export = plugin;
