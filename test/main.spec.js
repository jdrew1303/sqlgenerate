import { expect } from 'chai';
import sqlgenerate from '..';

xdescribe('basic tests', () => {
    it('displays the version', () => {
        expect(sqlgenerate.version).to.be.equal(require('../package.json').version);
    });
    
    it('contains the generate api', () => {
        expect(sqlgenerate.generate).to.be.a('function');
    });
    
});