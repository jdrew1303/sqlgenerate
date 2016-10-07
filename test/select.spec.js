import { expect } from 'chai';
import parser from 'sqlite-parser';
import {generate, generateExpression} from '..';
import { readFile } from 'fs';

import basicSelect from '../test/json/select/basic-select.json';

describe('Select', () => {
    it('generates a basic select statement', (done) => {
        generateTestForFile('test/sql/select/basic-select.sql', done);
    });
});

function generateTestForFile(filepath, done){
    readFile(filepath, (err, data) => {
        if (err) throw "Unable to read file";
        var sql = data.toString();
        expectResultAndFileToBeEqual(sql);
        done();
    });
}

function expectResultAndFileToBeEqual(sql){
  
  var original = standardiseString(sql);
  var ast = parser(sql);
  
  var regeneratedSQL = generate(ast);
  var result = standardiseString(regeneratedSQL);
  
  // perform a simple check on the generated sql to make sure it parses
  var isParsible = parser(regeneratedSQL)
  
  console.log('[select] ', generate(ast));
  
  expect(isParsible).to.deep.equal(ast);
  expect(original).to.equal(result);
}

// We need to clean all whitespace from the string as there is some 
// excess space that cant be removed thats interfering with the tests. 
function standardiseString(str){
  return str.replace(/\s+/g, '').toLowerCase();
}