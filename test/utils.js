'use strict';

const ExtendableError = require('../lib/utils').ExtendableError;

describe('lib/utils', () => {
    describe('Error', () => {
        it('should be an Error inheritor', () => {
            const error = new ExtendableError('msg');

            assert.isTrue(error instanceof Error);
        });

        it('should create regular error if only message specified', () => {
            const error = new ExtendableError('msg');

            assert.equal(error.message, 'msg');
            assert.match(error.stack, /^Error: msg\n/);
            assert.notInclude(error.stack, '\nCaused by:\n');
        });

        it('should create regular error if cause exception has no stack', () => {
            const error = new ExtendableError('msg', {});

            assert.equal(error.message, 'msg');
            assert.match(error.stack, /^Error: msg\n/);
            assert.notInclude(error.stack, '\nCaused by:\n');
        });

        it('should create error with extended stack if cause exception has stack', () => {
            const error = new ExtendableError('msg', {stack: 'Custom stack'});

            assert.equal(error.message, 'msg');
            assert.match(error.stack, /^Error: msg\n/);
            assert.include(error.stack, '\nCaused by:\n');
            assert.include(error.stack, '\nCustom stack');
        });
    });
});
