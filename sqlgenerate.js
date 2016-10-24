'use strict';

// Needed to allow its use in older versions of Node and Browsers.
import 'babel-polyfill';
import {map, join, head, compose, curry, toUpper} from 'ramda';

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
        select : (n) => {
            const recurser = recurse(generator);
            const argsList = compose(join(', '), mapr(generator));
            
            var str = ['SELECT '];
            if (n.result) {
                const results = argsList(n.result);
                str.push(`${results}${LINE_END}`);
            }
            if (n.from) {
                const from = recurser(n.from);
                str.push(`${INDENT}FROM ${from}${LINE_END}`);
            }
            if (n.where) {
                const whereNode = head(n.where);
                const where = recurser(whereNode);
                str.push(`${INDENT}WHERE ${where}${LINE_END}`);
            }
            if (n.group) {
                const group = recurser(n.group);
                str.push(`${INDENT}GROUP BY ${group}${LINE_END}`);
            }
            if (n.having) {
                const having = recurser(n.having);
                str.push(`${INDENT}HAVING ${having}${LINE_END}`);
            }
            if (n.order) {
                const order = recurser(head(n.order));
                str.push(`${INDENT}ORDER BY ${order}${LINE_END}`);
            }
            if (n.limit) {
                const limit = recurser(n.limit);
                str.push(`${INDENT}${limit}`);
            }
            return str.join('');
        },
        compound : (n) => {
            const firstStatement = recurse(generator)(n.statement);
            const compound = mapr(generator)(n.compound);
            return `${firstStatement}${compound}`;
        },
        create : (n) => {
            const tableName = recurse(generator)(n.name);
            const definitionsList = compose(join(`,${LINE_END}`), mapr(generator));
            const definitions = definitionsList(n.definition);
            return `CREATE TABLE ${tableName} (${LINE_END}${definitions}${LINE_END})`;
        }
    },
    compound : {
        union : (n) => {
            const statement = recurse(generator)(n.statement);
            return `${toUpper(n.variant)}${LINE_END}${statement}`;
        },
        get 'union all'(){
            return this.union;
        }
    },
    identifier : {
        star : (n) => n.name,
        table : (n) => {
            const alias =  (n.alias)  ? `AS ${n.alias}` : '';
            const index = (n.index) ? recurse(generator)(n.index) : '';
            return `\`${n.name}\` ${alias} ${index}`;
        },
        index : (n) => `INDEXED BY ${n.name}`,
        column : (n) => {
            const recurser = recurse(generator);
            const alias =  (n.alias) ? `AS [${n.alias}]` : '';
            const index = (n.index) ? recurser(n.index) : '';
            return `${n.name} ${alias} ${index}`;
        },
        'function' : (n) => n.name,
    },
    literal : {
        text : (n) => `'${n.value}'`,
        decimal : (n) => `${n.value}`
    },
    expression : {
        operation : (n) => {
            const recurser = recurse(generator);
            const left = recurser(n.left);
            const right = recurser(n.right);
            return `(${left} ${n.operation} ${right})`;
        },
        list : (n) => {
            const argsList = compose(join(', '), mapr(generator));
            return argsList(n.expression);
        },
        order : (n) => {
            const recurser = recurse(generator);
            const expression = recurser(n.expression);
            const direction = n.direction;
            return `${expression} ${toUpper(direction)}`;
        },
        limit : (n) => {
            const recurser = recurse(generator);
            const limit = recurser(n.start);
            const offset = recurser(n.offset);
            return `LIMIT ${limit}${LINE_END}${INDENT}OFFSET ${offset}`;
        }
    },
    'function' : (n) => {
        const recurser = recurse(generator);
        const name = toUpper(recurser(n.name));
        const args = recurser(n.args);
        const alias =  (n.alias)  ? `AS ${n.alias}` : '';
        return `${name}(${args}) ${alias}`;
    },
    map : {
        join : (n) => {
            const recurser = recurse(generator);
            const source = recurser(n.source);
            const sourceAlias = (n.source.alias)? n.source.alias : '';
            const join = recurser(head(n.map));
            return `(${source}) AS ${sourceAlias}${LINE_END}${join}`;
        }
    },
    join : {
        join : (n) => {
            const recurser = recurse(generator);
            const source = recurser(n.source);
            const constraint = recurser(n.constraint);
            return `${INDENT}JOIN ${source}${LINE_END}${constraint}`;
        }
    },
    constraint : {
        join : (n) => {
            const on = recurse(generator)(n.on);
            return `${INDENT}ON ${on}${LINE_END}`;
        },
        'primary key' : () => `PRIMARY KEY`,
        'not null': () => `NOT NULL`,
        unique : () => `UNIQUE`,
        check : (n) => {
            const check = recurse(generator)(n.expression);
            return `CHECK ${check}`;
        }
    },
    definition : {
        column : (n) => {
            const recurser = recurse(generator);
            const datatype = recurser(n.datatype);
            const constraintsList = compose(join(' '), map(recurser));
            const constraints = constraintsList(n.definition);
            return `${n.name} ${datatype} ${constraints}`;
        }
    },
    datatype : {
        int : (n) => `${n.variant}`,
        varchar : (n) => {
            const arg = recurse(generator)(n.args);
            return `varchar(${arg})`;
        }
    }
};

module.exports = {
    version         : require('./package.json').version,
    generate        : (n) => generator[n.type][n.variant](n)
};