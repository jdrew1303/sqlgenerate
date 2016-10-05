import { expect } from 'chai';
import sqlgenerate from '..';

describe('basic tests', () => {
    it('displays the version', () => {
        expect(sqlgenerate.version).to.be.equal(require('../package.json').version);
    });
    
    it('contains the generate api', () => {
        expect(sqlgenerate.generate).to.be.a('function');
    });
    
    it('returns a string', () => {
        const ast = {
            "type": "statement",
            "variant": "select",
            "result": []
        }
        expect(sqlgenerate.generate(ast)).to.be.a('string');
    });
    
    
});