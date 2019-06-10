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
});
