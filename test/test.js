const assert = require('assert');

describe('random tests', () => {
    describe('function sending', () => {
        it('should create a function, toString it, and recreate it to return 5', async () => {
            const func = () => { return 5; };
            const funcRemade = new Function(`return ${func.toString()}`)();
            assert.strictEqual(await funcRemade(), 5);
        });

        it('should create an async function, toString it, and recreate it to return 5 after 2 seconds', async () => {
            const func = async () => {
                await setTimeout(() => {}, 2000);
                return 5;
            };
            const funcRemade = new Function(`return ${func.toString()}`)();
            assert.strictEqual(await funcRemade(), 5);
        });

        it('should create a function with an input, toString it, and recreate it', () => {
            const func = x => { return x + 1; };
            const funcRemade = new Function(`return ${func.toString()}`)();
            assert.strictEqual(funcRemade(1), 2);
        });

        it('should create a function which calls a prop function.', () => {
            const func = data => { return data.x() + 2; };
            const funcRemade = new Function(`return ${func.toString()}`)();
            assert.strictEqual(funcRemade({ x: () => 1 }), 3);
        });

        it('should create a function and catch its exception', async () => {
            const func = () => {
                const t = undefined;
                return t.test();
            };
            const funcRemade = new Function(`return ${func.toString()}`)();
            let val;
            try {
                val = funcRemade();
            } catch (e) {
                console.log('that didnt work!');
            }
            assert.strictEqual(val, 5);
        });
    });

    describe('names', () => {
        const findName = (base, index, taken) => {
            if (taken.includes(base))
                return findName(`${base.endsWith(` (${index})`) ? base.substring(0, base.length - 3 - `${index}`.length) : base} (${++index})`, index, taken);
            return base;
        };

        it('should find PROFILE_NAME given empty taken list', () =>
            assert.strictEqual(findName('PROFILE_NAME', 0, []), 'PROFILE_NAME'));

        it('should find \'PROFILE_NAME (1)\' given a list of [ PROFILE_NAME ]', () =>
            assert.strictEqual(findName('PROFILE_NAME', 0, [ 'PROFILE_NAME' ]), 'PROFILE_NAME (1)'));

        it('should find \'PROFILE_NAME (2)\' given a list of [ PROFILE_NAME, PROFILE_NAME (1) ]', () =>
            assert.strictEqual(findName('PROFILE_NAME', 0, [ 'PROFILE_NAME', 'PROFILE_NAME (1)' ]), 'PROFILE_NAME (2)'));

        it('should find \'PROFILE_NAME (5)\'', () =>
            assert.strictEqual(findName('PROFILE_NAME', 0, [ 'PROFILE_NAME', 'PROFILE_NAME (1)', 'PROFILE_NAME (2)', 'PROFILE_NAME (3)', 'PROFILE_NAME (4)', 'PROFILE_NAME (6)' ]), 'PROFILE_NAME (5)'));
    });

    describe('lock', () => {
        const lock = require('../src/main/util/lockfile');

        it('should lock with async await', async () => {
            const pathh = 'C:\\dev\\RandomOutput\\lock.lock';
            await lock.lock(pathh);

            const test = await lock.check(pathh);

            await lock.unlock(pathh);

            assert.ok(test);

        })
    });

    describe('mod info', () => {
        const jar = require('path').resolve('C:\\Users\\mattworzala\\Downloads\\RoughlyEnoughItems-2.9.4+build.129.jar');
        // const jar = require('path').resolve('C:\\Users\\mattworzala\\Downloads\\TConstruct-1.12.2-2.12.0.135.jar');
        const StreamZip = require('node-stream-zip');

        const loadModInfo = file => new Promise(async resolve => {
            if (!file.endsWith('jar') && !file.endsWith('dis'))
                return { error: 'not jar', errorMessage: 'The supplied file did not end with jar or dis.' };
            let info = {};
            const archive = new StreamZip({ file: file, storeEntries: true });
            archive.on('ready', () => {
                for (const entry of Object.values(archive.entries())) {
                    if (entry.name !== 'mcmod.info' && entry.name !== 'fabric.mod.json')
                        continue;
                    const base64IconSafe = iconFile => new Promise(resolve => {
                        if (iconFile === undefined)
                            return resolve('');
                        archive.stream(iconFile, (err, stream) => {
                            let body = 'data:image/png;base64,';
                            stream.setEncoding('base64');
                            stream.on('data', data => body += data);
                            stream.on('end', () => resolve(body));
                        })
                    });
                    let body = '';
                    archive.stream(entry.name, (err, stream) => {
                        stream.setEncoding('utf8');
                        stream.on('data', data => body += data);
                        stream.on('end', async () => {
                            const mod = JSON.parse(body);
                            if (entry.name === 'mcmod.info') {
                                const convert = async json => { return {
                                    id: json.modid,
                                    name: json.name,
                                    authors: json.authorList,
                                    description: json.description.trim(),
                                    version: json.version,
                                    flavor: 'forge',
                                    minecraftVersion: json.mcversion,
                                    icon: await base64IconSafe(json.logoFile),
                                    url: json.url,
                                }};
                                info = await convert(mod[0]);
                                mod.shift();
                                info.extras = mod.map(async () => await convert());
                            } else {
                                info = {
                                    id: mod.id,
                                    name: mod.name,
                                    authors: mod.authors,
                                    description: mod.description,
                                    version: mod.version,
                                    flavor: 'fabric',
                                    icon: await base64IconSafe(mod.icon),
                                    url: mod.contact.homepage,
                                }
                            }
                            archive.close(() => resolve(info));
                        });
                    });
                    break;
                }
            });
        });

        it('does it work?', async () => {
            console.log(await loadModInfo(jar));
            assert.ok(false);
        })
    });
});
