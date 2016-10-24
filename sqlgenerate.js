'use strict';

// Needed to allow its use in older versions of Node and Browsers.
import 'babel-polyfill';
import {map, join, head, compose, curry} from 'ramda';

const INDENT = '\t';
const LINE_END = '\n';

const recurse = curry((generator, n) => {
    return (n.type === 'function') ? generator['function'](n) 
                                   : generator[n.type][n.variant](n);
});

const mapr = compose(map, recurse);

const generator = {
    statement : {
        list : (node) => {
            const s = compose(join('\n'), mapr(generator));
            return s(node.statement);
        },
        select : (node) => {
            const recurser = recurse(generator);
            const argsList = compose(join(', '), mapr(generator));
            
            var str = ['SELECT '];
            if (node.result) {
                const results = argsList(node.result);
                str.push(`${results}${LINE_END}`);
            }
            if (node.from) {
                const from = recurser(node.from);
                str.push(`${INDENT}FROM ${from}${LINE_END}`);
            }
            if (node.where) {
                const whereNode = head(node.where);
                const where = recurser(whereNode);
                str.push(`${INDENT}WHERE ${where}${LINE_END}`);
            }
            if (node.group) {
                const group = recurser(node.group);
                str.push(`${INDENT}GROUP BY ${group}${LINE_END}`);
            }
            if (node.having) {
                const having = recurser(node.having);
                str.push(`${INDENT}HAVING ${having}${LINE_END}`);
            }
            if (node.order) {
                const orderNode = head(node.order);
                const order = recurser(orderNode);
                str.push(`${INDENT}ORDER BY ${order}${LINE_END}`);
            }
            if (node.limit) {
                const limit = recurser(node.limit);
                str.push(`${INDENT}${limit}`);
            }
            return str.join('');
        },
        compound : (node) => {
            const recurser = recurse(generator);
            const firstStatement = recurser(node.statement);
            
            const compound = map(recurser)(node.compound);
            return `${firstStatement}${compound}`;
        },
        create : (node) => {
            const recurser = recurse(generator);
            const tableName = recurser(node.name);

            const mapList = map(recurser);
            const definitionsList = compose(join(`,${LINE_END}`), mapList);
            const definitions = definitionsList(node.definition);

            return `CREATE TABLE ${tableName} (${LINE_END}${definitions}${LINE_END})`;
        }
    },
    compound : {
        union : (node) => {
            const recurser = recurse(generator);
            const statement = recurser(node.statement);
            return `${node.variant.toLocaleUpperCase()}${LINE_END}${statement}`;
        },
        get 'union all'(){
            return this.union;
        }
    },
    identifier : {
        star : (n) => n.name,
        table : (node) => {
            const recurser = recurse(generator);
            const alias =  (node.alias)  ? `AS ${node.alias}` 
                                              : ``;
            const index = (node.index) ? recurser(node.index) 
                                       : '';
            return `\`${node.name}\` ${alias} ${index}`;
            
        },
        index : (node) => `INDEXED BY ${node.name}`,
        column : (node) => {
            const recurser = recurse(generator);
            const alias =  (node.alias)  ? `AS [${node.alias}]` 
                                              : ``;
            const index = (node.index) ? recurser(node.index) 
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
            const recurser = recurse(generator);
            const left = recurser(node.left);
            const right = recurser(node.right);
            return `(${left} ${node.operation} ${right})`;
        },
        list : (node) => {
            const argsList = compose(join(', '), mapr(generator));
            return argsList(node.expression);
        },
        order : (node) => {
            const recurser = recurse(generator);
            const expression = recurser(node.expression);
            const direction = node.direction;
            return `${expression} ${direction.toLocaleUpperCase()}`;
        },
        limit : (node) => {
            const recurser = recurse(generator);
            const limit = recurser(node.start);
            const offset = recurser(node.offset);
            return `LIMIT ${limit}${LINE_END}${INDENT}OFFSET ${offset}`;
        }
    },
    'function' : (node) => {
        const recurser = recurse(generator);
        const name = recurser(node.name);
        const args = recurser(node.args);
        const alias =  (node.alias)  ? `AS ${node.alias}` : ``;
        return `${name.toLocaleUpperCase()}(${args}) ${alias}`;
    },
    map : {
        join : (node) => {
            const recurser = recurse(generator);
            const source = recurser(node.source);
            const sourceAlias = (node.source.alias)? node.source.alias : '';
            const joinNode = head(node.map);
            const join = recurser(joinNode);
            return `(${source}) AS ${sourceAlias}${LINE_END}${join}`;
        }
    },
    join : {
        join : (node) => {
            const recurser = recurse(generator);
            const source = recurser(node.source);
            const constraint = recurser(node.constraint);
            return `${INDENT}JOIN ${source}${LINE_END}${constraint}`;
        }
    },
    constraint : {
        join : (node) => {
            const recurser = recurse(generator);
            const on = recurser(node.on);
            return `${INDENT}ON ${on}${LINE_END}`;
        },
        'primary key' : () => `PRIMARY KEY`,
        'not null': () => `NOT NULL`,
        unique : () => `UNIQUE`,
        check : (node) => {
            const recurser = recurse(generator);
            const check = recurser(node.expression);
            return `CHECK ${check}`;
        }
    },
    definition : {
        column : (node) => {
            const recurser = recurse(generator);
            const datatype = recurser(node.datatype);
            const constraintsList = compose(join(' '), map(recurser));
            const constraints = constraintsList(node.definition);
            return `${node.name} ${datatype} ${constraints}`;
        }
    },
    datatype : {
        int : (node) => `${node.variant}`,
        varchar : (node) => {
            const recurser = recurse(generator);
            const arg = recurser(node.args);
            return `varchar(${arg})`;
        }
    }
};

module.exports = {
    version         : require('./package.json').version,
    generate        : (n) => generator[n.type][n.variant](n)
};