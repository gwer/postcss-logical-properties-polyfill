import postcss, { Declaration, list } from 'postcss';

import { Direction } from './types';

type TransformValueLiteral = 'left' | 'right';
type TransformDirectionLiteral = 'top' | 'bottom' | 'left' | 'right';
type TransformBorderRadiusLiteral = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface TransformOptions {
    valueStart: TransformValueLiteral;
    valueEnd: TransformValueLiteral;

    inlineStart: TransformDirectionLiteral;
    inlineEnd: TransformDirectionLiteral;
    blockStart: TransformDirectionLiteral;
    blockEnd: TransformDirectionLiteral;

    borderStartStart: TransformBorderRadiusLiteral;
    borderStartEnd: TransformBorderRadiusLiteral;
    borderEndStart: TransformBorderRadiusLiteral;
    borderEndEnd: TransformBorderRadiusLiteral;
}

type Transformer = (
    decl: Readonly<Declaration>,
    options: Readonly<TransformOptions>,
) => Declaration | Array<Declaration> | undefined;

function getDirectionParams(
    decl: Declaration,
    options: TransformOptions,
): ['block' | 'inline', TransformDirectionLiteral, TransformDirectionLiteral] {
    if (decl.prop.includes('block')) {
        return ['block', options.blockStart, options.blockEnd];
    } else {
        return ['inline', options.inlineStart, options.inlineEnd];
    }
}

const replaceInlinePositioning: Transformer = (decl, { inlineStart, inlineEnd }) => {
    if (decl.prop.toLowerCase().includes('start')) {
        return decl.clone({ prop: inlineStart });
    } else {
        return decl.clone({ prop: inlineEnd });
    }
};

const replaceBlockPositioning: Transformer = (decl, { blockStart, blockEnd }) => {
    if (decl.prop.toLowerCase().includes('start')) {
        return decl.clone({ prop: blockStart });
    } else {
        return decl.clone({ prop: blockEnd });
    }
};

const replaceInsetShorthand: Transformer = (decl, options) => {
    const parts = list.space(decl.value);
    if (parts[0] === 'logical') {
        return [
            decl.clone({ prop: options.blockStart, value: parts[1] }),
            decl.clone({ prop: options.inlineStart, value: parts[2] ?? parts[1] }),
            decl.clone({ prop: options.blockEnd, value: parts[3] ?? parts[1] }),
            decl.clone({ prop: options.inlineEnd, value: parts[4] ?? parts[2] ?? parts[1] }),
        ];
    }

    return [
        decl.clone({ prop: 'top', value: parts[0] }),
        decl.clone({ prop: 'left', value: parts[1] ?? parts[0] }),
        decl.clone({ prop: 'bottom', value: parts[2] ?? parts[0] }),
        decl.clone({ prop: 'right', value: parts[3] ?? parts[1] ?? parts[0] }),
    ];
};

const replacePositioningShorthand: Transformer = (decl, options) => {
    const [, start, end] = getDirectionParams(decl, options);
    const parts = list.space(decl.value);

    return [decl.clone({ prop: start, value: parts[0] }), decl.clone({ prop: end, value: parts[1] ?? parts[0] })];
};

const replaceBorderRadius: Transformer = (decl, options) => {
    return decl.clone({
        prop: decl.prop
            .replace('start-start', options.borderStartStart)
            .replace('start-end', options.borderStartEnd)
            .replace('end-start', options.borderEndStart)
            .replace('end-end', options.borderEndEnd),
    });
};

const transformationMap: Record<string, Transformer> = {
    // https://www.w3.org/TR/css-logical-1/#inset-properties
    inset: replaceInsetShorthand,
    'inset-block': replacePositioningShorthand,
    'inset-block-start': replaceBlockPositioning,
    'inset-block-end': replaceBlockPositioning,
    'inset-inline': replacePositioningShorthand,
    'inset-inline-start': replaceInlinePositioning,
    'inset-inline-end': replaceInlinePositioning,

    // https://www.w3.org/TR/css-logical-1/#border-radius-shorthands
    'border-start-start-radius': replaceBorderRadius,
    'border-start-end-radius': replaceBorderRadius,
    'border-end-start-radius': replaceBorderRadius,
    'border-end-end-radius': replaceBorderRadius,
};

function shouldFindTransformer(prop: string): Transformer {
    const transformer = transformationMap[prop.toLowerCase()];
    if (!transformer) {
        throw new Error(`Unknown declaration property received: "${prop}"`);
    }

    return transformer;
}

function shouldGetTransformerOptions(direction: Direction): TransformOptions {
    const options: Omit<TransformOptions, 'valueStart' | 'valueEnd' | 'resizeBlock' | 'resizeInline'> = {
        inlineStart: 'left',
        inlineEnd: 'right',
        blockStart: 'top',
        blockEnd: 'bottom',
        borderStartStart: 'top-left',
        borderStartEnd: 'top-right',
        borderEndStart: 'bottom-left',
        borderEndEnd: 'bottom-right',
    };

    if (direction === 'rtl') {
        [options.inlineStart, options.inlineEnd] = [options.inlineEnd, options.inlineStart];
        [options.borderStartStart, options.borderStartEnd] = [options.borderStartEnd, options.borderStartStart];
        [options.borderEndStart, options.borderEndEnd] = [options.borderEndEnd, options.borderEndStart];
    }

    return {
        valueStart: direction === 'ltr' ? 'left' : 'right',
        valueEnd: direction === 'ltr' ? 'right' : 'left',
        ...options,
    };
}

export function isSupportedProp(prop: string): boolean {
    return prop.toLowerCase() in transformationMap;
}

export function transformToNonLogical(
    decl: Readonly<Declaration>,
    direction: Direction,
): Declaration | Array<Declaration> | undefined {
    const transformer = shouldFindTransformer(decl.prop);
    const options = shouldGetTransformerOptions(direction);

    return transformer(decl, options);
}
