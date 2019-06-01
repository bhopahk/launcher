/*
Copyright (c) 2019 Matt Worzala <bhop.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const assert = require('assert');

describe('mojang.js', () => {
    const mojang = require('../src/main/mojang/mojang');

    describe('status', () => {
        it('should give a valid status for \'minecraft.net\'', async () => {
            const status = await mojang.apiStatus();
            assert.ok(status.hasOwnProperty('minecraft.net'));
        });
    });

    describe('statistics', () => {
        it('should return an object with a \'total\' attribute when given valid keys.', async () => {
            const stats = await mojang.statistics('item_sold_minecraft', 'prepaid_card_redeemed_minecraft');
            assert.ok(stats.hasOwnProperty('total'));
        });

        it('should throw an exception when given an invalid key', async () => {
            let err;
            try {
                await mojang.statistics('item_sold_minecraft', 'this_is_not_a_valid_key');
            } catch (e) { err = e; }
            assert.notStrictEqual(err, undefined);
        });
    });

    describe('blocked servers', () => {
        it('should return an array of non-zero length', async () => {
            const banList = await mojang.blockedServers();
            assert.notStrictEqual(banList.length, 0);
        });
    });

    describe('accounts (anonymous)', () => {
        describe('name to uuid', () => {
            it('should return \'d79d790a8e904d78958a780c7fadeaab\' for \'bhop_\'', async () => {
                const resp = await mojang.nameToUuid('bhop_');
                assert.strictEqual(resp.id, 'd79d790a8e904d78958a780c7fadeaab');
            });

            it('should return the name \'Bhop21\' for \'bhop_\' at time 0', async () => {
                const resp = await mojang.nameToUuid('bhop_', 0);
                assert.strictEqual(resp.name, 'Bhop21');
            });

            it('should reject when given no name', async () => {
                let err;
                try {
                    await mojang.nameToUuid();
                } catch (e) { err = e; }
                assert.notStrictEqual(err, undefined);
            });

            it('should reject when given an invalid name', async () => {
                let err;
                try {
                    await mojang.nameToUuid('this_is_not_a_valid_username');
                } catch (e) { err = e; }
                assert.notStrictEqual(err, undefined);
            });

            it('should reject when given an invalid time', async () => {
                let err;
                try {
                    await mojang.nameToUuid('bhop_', 'invalid_time');
                } catch (e) { err = e; }
                assert.notStrictEqual(err, undefined);
            });
        });

        describe('batch names to uuids', () => {
            it('should return two items for \'bhop_\' and \'3640\'', async () => {
                const result = await mojang.batchNameToUuid('bhop_', '3640');
                assert.strictEqual(result.length, 2);
            });

            it('should ignore invalid names without rejection', async () => {
                const result = await mojang.batchNameToUuid('bhop_', 'not_a_valid_username');
                assert.strictEqual(result.length, 1);
            });

            it('should return zero results for no arguments', async () => {
                const result = await mojang.batchNameToUuid();
                assert.strictEqual(result.length, 0);
            });
        });

        describe('name history', () => {
            it('should return 3 items for \'d79d790a8e904d78958a780c7fadeaab\'', async () => {
                const resp = await mojang.nameHistory('d79d790a8e904d78958a780c7fadeaab');
                assert.strictEqual(resp.length, 3);
            });

            it('should reject when given no uuid', async () => {
                let err;
                try {
                    await mojang.nameHistory();
                } catch (e) { err = e; }
                assert.notStrictEqual(err, undefined);
            });
        });

        describe('user data', () => {
            it('should return valid profile for \'d79d790a8e904d78958a780c7fadeaab\'', async () => {
                const resp = await mojang.userData('d79d790a8e904d78958a780c7fadeaab');
                assert.notStrictEqual(resp.id, undefined);
            });

            it('should reject when given no uuid', async () => {
                let err;
                try {
                    await mojang.userData();
                } catch (e) { err = e; }
                assert.notStrictEqual(err, undefined);
            });

            it('should reject when given nonexistent uuid', async () => {
                let err;
                try {
                    await mojang.userData('not_a_valid_uuid_same_characters');
                } catch (e) { err = e; }
                assert.notStrictEqual(err, undefined);
            });
        });
    });

    describe('accounts (logged in)', () => {
        before(async () => {
            if (this.__clientToken === undefined)
                this.__clientToken = require('crypto').randomBytes(10).toString('hex');
            const resp = await mojang.login(process.env.MC_USERNAME, process.env.MC_PASSWORD, this.__clientToken, false);
            if (resp.hasOwnProperty('accessToken'))
                this.__accessToken = resp.accessToken;
            else throw resp.errorMessage;
        });

        after(async () => {
            await mojang.invalidateToken(this.__accessToken, this.__clientToken);
            delete this.__accessToken;
        });

        describe('access tokens', () => {
            it('should have created an access token', async () => {
                assert.notStrictEqual(this.__accessToken, undefined);
            });

            it('should refresh an access token', async () => {
                this.__accessToken = (await mojang.refreshToken(this.__accessToken, this.__clientToken, false)).accessToken;
                assert.notStrictEqual(this.__accessToken, undefined);
            });

            it('should have created and refreshed a valid access token', async () => {
                assert.ok(await mojang.validateToken(this.__accessToken));
            });

            // This is disabled because of the unpredictable rate limiting of the /authentication endpoint.
            //it('has invalidated an access token', async () => {
            //    const token = await mojang.login(process.env.MC_USERNAME, process.env.MC_PASSWORD, this.__clientToken, false).accessToken;
            //    assert.ok(await mojang.invalidateToken(token, this.__clientToken));
            //});
        });

        describe('skins', () => {

        });
    });
});
