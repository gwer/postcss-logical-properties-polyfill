import postcss, { Declaration } from 'postcss';
import { transformToNonLogical } from '../src/transformers';
import { Direction } from '../src/types';

describe('transformToNonLogical', () => {
    describe('logical border-radius', () => {
        const input = {
            ss: postcss.decl({ prop: 'border-start-start-radius', value: '0px' }),
            se: postcss.decl({ prop: 'border-start-end-radius', value: '1px' }),
            es: postcss.decl({ prop: 'border-end-start-radius', value: '2px' }),
            ee: postcss.decl({ prop: 'border-end-end-radius', value: '3px' }),
        };

        function runTest(direction: Direction, expectedResult: typeof input) {
            for (const side in input) {
                // @ts-ignore
                const decl = input[side];
                // @ts-ignore
                const expected = expectedResult[side];

                const transformedDecl = transformToNonLogical(decl, direction);
                expect(transformedDecl).toBeDefined();
                expect(transformedDecl).toBeInstanceOf(Declaration);
                expect((transformedDecl as Declaration).prop).toStrictEqual(expected.prop);
                expect((transformedDecl as Declaration).value).toStrictEqual(expected.value);
            }
        }

        it('horizontal-tb', () => {
            runTest('ltr', {
                ss: postcss.decl({ prop: 'border-top-left-radius', value: '0px' }),
                se: postcss.decl({ prop: 'border-top-right-radius', value: '1px' }),
                es: postcss.decl({ prop: 'border-bottom-left-radius', value: '2px' }),
                ee: postcss.decl({ prop: 'border-bottom-right-radius', value: '3px' }),
            });

            runTest('rtl', {
                ss: postcss.decl({ prop: 'border-top-right-radius', value: '0px' }),
                se: postcss.decl({ prop: 'border-top-left-radius', value: '1px' }),
                es: postcss.decl({ prop: 'border-bottom-right-radius', value: '2px' }),
                ee: postcss.decl({ prop: 'border-bottom-left-radius', value: '3px' }),
            });
        });
    });

    it('should throw an error when non transformable declaration has been passed', () => {
        const decl = postcss.decl({
            prop: 'color',
            value: '#fff',
        });

        expect(() => transformToNonLogical(decl, 'rtl')).toThrow('Unknown declaration property received: "color"');
    });
});
