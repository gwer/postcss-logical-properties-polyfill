import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import postcss, { ProcessOptions } from 'postcss';

import plugin from './../src/plugin';

async function loadFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString());
            }
        });
    });
}

async function run(
    fixturePath: string,
    pluginOpts: Parameters<typeof plugin>[0] = {},
    postcssOpts: Omit<ProcessOptions, 'from'> = {},
) {
    const sha256Short = crypto
        .createHash('sha256')
        .update(JSON.stringify({ pluginOpts, postcssOpts }))
        .digest('base64')
        .replace('/', '_')
        .replace('+', '-')
        .substr(0, 8);

    const inputData = await loadFile(fixturePath);
    const outputFileNameParts = path.basename(fixturePath).split('.');
    outputFileNameParts.splice(-1, 0, sha256Short);
    // +10 because we need to remove 2 slashes and "fixtures" word (8 chars)
    const outputFilePath = path.join(
        __dirname,
        'output',
        path.dirname(fixturePath).substr(__dirname.length + 10),
        outputFileNameParts.join('.'),
    );

    const result = await postcss(plugin(pluginOpts)).process(inputData, { ...postcssOpts, from: undefined });

    expect(result.css).toMatchFile(outputFilePath);
    expect(result.warnings()).toHaveLength(0);
}

describe('properties transformation', () => {
    describe('CSS', () => {
        const fixturesPrefix = path.join(__dirname, 'fixtures', 'css');
        fs.readdirSync(fixturesPrefix).forEach((fixtureName) => {
            it(fixtureName, () => run(path.join(fixturesPrefix, fixtureName)));
        });
    });
});

describe('options', () => {
    it('preserve', () => {
        return run(path.join(__dirname, 'fixtures', 'real-world-example.css'), {
            preserve: false,
        });
    });
});
