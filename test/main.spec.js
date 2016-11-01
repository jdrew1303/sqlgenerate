import { expect }   from 'chai';
import { generate } from '..';
import { readFile } from 'fs';
import parser       from 'sqlite-parser';
import glob         from 'glob';
import * as _       from 'lodash';

describe('test suite', () => {
    // get all sql files in our test suite
    const files = glob.sync('test/sql/**/*.sql');
    
    // extract information from the filepath names
    const tests = _.groupBy(_.map(files, (file) => {
        let r = /^test\/sql\/([\s\S]*)\/([\s\S]*)\.sql/gi.exec(file);
        return {
            filePath : file,
            group : r[1], 
            name : r[2]
        };
    }), 'group');
    
    // extract a list of the main areas under test
    let groups = _.keys(tests);

    // we dynamically generate the test suites from the above information
    _.map(groups, (group) => {
        
        describe(`${group} statements`, () => {
            
            _.map(tests[group], (test) => {
                it('generates ' + test.name, (done) => {
                    readFile(test.filePath, (err, data) => {
                        if (err) throw "Unable to read file";
                        
                        const sql = data.toString();
                        const ast = parser(sql);
                        const regeneratedSQL = generate(ast);
                        const isParsible = parser(regeneratedSQL);
                       
                        expect(isParsible).to.deep.equal(ast);
                        expect(standardiseString(regeneratedSQL)).to.equal(standardiseString(sql));
                        done();
                    });
                });
            });
        });
    });
});

function standardiseString(str){
    // We want to strip all optional items from strings before testing equality.
    // The strings could have different options for these items and they 
    // interfere with the tests.
    return str.replace(/\s+/gi, '')
              .replace(/\(*/gi, '')
              .replace(/\)*/gi, '')
              .replace(/\`*/gi, '')
              .replace(/\;*/gi, '')
              .replace(/\"*/gi, '')
              .toLowerCase();
}