import { expect } from 'chai';
import sqlgenerate from '..';

describe('basic tests', () => {
    it('displays the version', () => {
        expect(sqlgenerate.version).to.be.equal(require('../package.json').version);
    });
});