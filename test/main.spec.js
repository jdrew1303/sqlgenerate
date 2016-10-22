import { expect }   from 'chai';
import {generate}   from '..';
import { readFile } from 'fs';
import parser       from 'sqlite-parser';
import glob         from 'glob';
import * as _       from 'lodash';

describe('test suite', () => {
    // get all sql files in our test suite
    let files = glob.sync('test/sql/**/*.sql');
    
    // extract information from the filepath names
    let tests = _.groupBy(_.map(files, (file) => {
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
                        
                        var sql = data.toString();
                        var ast = parser(sql);
                        
                        var regeneratedSQL = generate(ast);
                        console.log(regeneratedSQL);
                        var isParsible = parser(regeneratedSQL)
                        
                        expect(isParsible).to.deep.equal(ast);
                        expect(standardiseString(sql)).to.equal(standardiseString(regeneratedSQL));
                        done();
                    });
                });
            });
        });
    });
});

function standardiseString(str){
  return str.replace(/\s+/g, '')
            .toLowerCase();
}