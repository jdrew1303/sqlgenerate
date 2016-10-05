import { expect } from 'chai';
import sqlgenerate from '..';

describe('basic tests', () => {
    it('should be able to display the version', () => {
        expect(sqlgenerate.version).to.be.equal(require('../package.json').version);
    })
});