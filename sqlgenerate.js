'use strict';

var sqltraverse = require('sqltraverse');
var generateExpression = require('./src/expressions');
var _ = require('lodash');

function generateSelect (selectNode) {
    
    var result = selectNode.result.map(function (result) {return result.name;}).join(', ');
    var from = selectNode.from.map(function (from) {return from.name;}).join(', ');
    var where = generateExpression(_.first(selectNode.where));
    
    return `SELECT ${result} FROM ${from} WHERE ${where}`;
}

function generate (ast) {
    return ast.statement.map(generateSelect).join('\n');
}

module.exports = {
    version         : require('./package.json').version,
    generate        : generate,
    attachComments  : sqltraverse.attachComments
};

