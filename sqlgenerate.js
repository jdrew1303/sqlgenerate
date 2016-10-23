'use strict';

// Needed to allow its use in older versions of Node and Browsers.
require('babel-polyfill');

// Trying to use as much functional methods as possible to clean up codebase. 
// Currently failing miserably. :(
var R = require('ramda');
var map = R.map;
var join = R.join;
// var prop = R.prop;
var head = R.head;
var compose = R.compose;

const INDENT = '\t';
const LINE_END = '\n';

const defaultGenerator = {
    statement : {
        list : (node) => {
            const mapList = map((n) => defaultGenerator[n.type][n.variant](n));
            return join('\n',mapList(node.statement));
        },
        select : (node) => {
            const mapList = map((n) => {
                return (n.type === 'function') ? defaultGenerator['function'](n) 
                                                  : defaultGenerator[n.type][n.variant](n);
            });
            const argsList = compose(join(', '), mapList);
            var str = ['SELECT '];
            if (node.result) {
                const results = argsList(node.result);
                str.push(`${results}${LINE_END}`);
            }
            if (node.from) {
                const from = defaultGenerator[node.from.type][node.from.variant](node.from);
                str.push(`${INDENT}FROM ${from}${LINE_END}`);
            }
            if (node.where) {
                const whereNode = head(node.where);
                const where = defaultGenerator[whereNode.type][whereNode.variant](whereNode);
                str.push(`${INDENT}WHERE ${where}${LINE_END}`);
            }
            if (node.group) {
                const group = defaultGenerator[node.group.type][node.group.variant](node.group);
                str.push(`${INDENT}GROUP BY ${group}${LINE_END}`);
            }
            if (node.having) {
                const having = defaultGenerator[node.having.type][node.having.variant](node.having);
                str.push(`${INDENT}HAVING ${having}${LINE_END}`);
            }
            if (node.order) {
                const orderNode = head(node.order);
                const order = defaultGenerator[orderNode.type][orderNode.variant](orderNode);
                str.push(`${INDENT}ORDER BY ${order}${LINE_END}`);
            }
            if (node.limit) {
                const limit = defaultGenerator[node.limit.type][node.limit.variant](node.limit);
                str.push(`${INDENT}${limit}`);
            }
            return str.join('');
        },
        compound : (node) => {
            const firstStatement = defaultGenerator[node.statement.type][node.statement.variant](node.statement);
            
            const compoundMap = map((n) => defaultGenerator[n.type][n.variant](n));
            const compound = compoundMap(node.compound);
            return `${firstStatement}${compound}`;
        },
        create : (node) => {
            const tableName = defaultGenerator[node.name.type][node.name.variant](node.name);

            const mapList = map((n) => defaultGenerator[n.type][n.variant](n));
            const definitionsList = compose(join(`,${LINE_END}`), mapList);
            const definitions = definitionsList(node.definition);

            return `CREATE TABLE ${tableName} (${LINE_END}${definitions}${LINE_END})`;
        }
    },
    compound : {
        union : (node) => {
            const statement = defaultGenerator[node.statement.type][node.statement.variant](node.statement);
            return `${node.variant.toLocaleUpperCase()}${LINE_END}${statement}`;
        },
        get 'union all'(){
            return this.union;
        }
    },
    identifier : {
        star : (n) => n.name,
        table : (node) => {
            
            const alias =  (node.alias)  ? `AS ${node.alias}` 
                                              : ``;
            const index = (node.index) ? defaultGenerator[node.index.type][node.index.variant](node.index) 
                                       : '';
            return `\`${node.name}\` ${alias} ${index}`;
            
        },
        index : (node) => `INDEXED BY ${node.name}`,
        column : (node) => {
            
            const alias =  (node.alias)  ? `AS [${node.alias}]` 
                                              : ``;
            const index = (node.index) ? defaultGenerator[node.index.type][node.index.variant](node.index) 
                                       : '';
            return `${node.name} ${alias} ${index}`;
            
        },
        'function' : (node) => node.name,
    },
    literal : {
        text : (node) => `'${node.value}'`,
        decimal : (node) => `${node.value}`
    },
    expression : {
        operation : (node) => {
            function side (node) {
                return (node.type === 'function') ? defaultGenerator['function'](node) 
                                                  : defaultGenerator[node.type][node.variant](node);
            }
            const left = side(node.left);
            const right = side(node.right);
            return `(${left} ${node.operation} ${right})`;
        },
        list : (node) => {
            const mapList = map((n) => defaultGenerator[n.type][n.variant](n));
            const argsList = compose(join(', '), mapList);
            return argsList(node.expression);
        },
        order : (node) => {
            const expression = defaultGenerator[node.expression.type][node.expression.variant](node.expression);
            const direction = node.direction;
            return `${expression} ${direction.toLocaleUpperCase()}`;
        },
        limit : (node) => {
            const limit = defaultGenerator[node.start.type][node.start.variant](node.start);
            const offset = defaultGenerator[node.offset.type][node.offset.variant](node.offset);
            return `LIMIT ${limit}${LINE_END}${INDENT}OFFSET ${offset}`;
        }
    },
    'function' : (node) => {
        const name = defaultGenerator[node.name.type][node.name.variant](node.name);
        const args = defaultGenerator[node.args.type][node.args.variant](node.args);
        const alias =  (node.alias)  ? `AS ${node.alias}` : ``;
        return `${name.toLocaleUpperCase()}(${args}) ${alias}`;
    },
    map : {
        join : (node) => {
            const source = defaultGenerator[node.source.type][node.source.variant](node.source);
            const sourceAlias = (node.source.alias)? node.source.alias : '';
            const joinNode = head(node.map);
            const join = defaultGenerator[joinNode.type][joinNode.variant](joinNode);
            return `(${source}) AS ${sourceAlias}${LINE_END}${join}`;
        }
    },
    join : {
        join : (node) => {
            const source = defaultGenerator[node.source.type][node.source.variant](node.source);
            const constraint = defaultGenerator[node.constraint.type][node.constraint.variant](node.constraint);
            
            return `${INDENT}JOIN ${source}${LINE_END}${constraint}`;
        }
    },
    constraint : {
        join : (node) => {
            const on = defaultGenerator[node.on.type][node.on.variant](node.on);
            return `${INDENT}ON ${on}${LINE_END}`;
        },
        'primary key' : () => `PRIMARY KEY`,
        'not null': () => `NOT NULL`,
        unique : () => `UNIQUE`,
        check : (node) => {
            const check = defaultGenerator[node.expression.type][node.expression.variant](node.expression);
            return `CHECK ${check}`;
        }
    },
    definition : {
        column : (node) => {
            const datatype = defaultGenerator[node.datatype.type][node.datatype.variant](node.datatype);
            
            const mapList = map((n) => defaultGenerator[n.type][n.variant](n));
            const constraintsList = compose(join(' '), mapList);
            const constraints = constraintsList(node.definition);
            
            return `${node.name} ${datatype} ${constraints}`;
        }
    },
    datatype : {
        int : (node) => `${node.variant}`,
        varchar : (node) => {
            const arg = defaultGenerator[node.args.type][node.args.variant](node.args);
            return `varchar(${arg})`;
        }
    }
};

module.exports = {
    version         : require('./package.json').version,
    generate        : (n) => defaultGenerator[n.type][n.variant](n)
};