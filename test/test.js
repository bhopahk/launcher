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
    })
});
