'use strict';

// Needed to allow its use in older versions of Node and Browsers.
import 'babel-polyfill';
import {map, join, head, compose, curry, toUpper, prop, equals, isEmpty, F, isArrayLike, concat, __} from 'ramda';
import {} from 'underscore.string.fp';

const INDENT = '\t';
const LINE_END = '\n';

const recurse = curry((generator, n) => {
    return (n.type === 'function') ? generator['function'](n) 
                                   : generator[n.type][n.variant](n);
});

const mapr = compose(map, recurse);

const datatype = (n) => n.variant;

const containsSelect = (s) => (s.indexOf('SELECT') !== -1);

const generator = {
    statement : {
        list : (n) => {
            const statements = compose(join('\n'), map(concat(__, ';')), mapr(generator));
            return statements(n.statement);
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
            const recurser = recurse(generator);
            const isCreateOfType = (n) => compose(equals(n), prop('format'));
            const isCreateIndex = isCreateOfType('index');
            const isCreateTable = isCreateOfType('table');
            
            if (isCreateIndex(n)) {
                const indexName = n.target.name;
                const onColumns = recurser(n.on);
                const where = recurser(head(n.where));
                return `CREATE INDEX ${indexName}${LINE_END}ON ${onColumns}${LINE_END}WHERE ${where}`;
            }
            
            if (isCreateTable(n)) {
                const tableName = recurse(generator)(n.name);
                const definitionsList = compose(join(`,${LINE_END}`), mapr(generator));
                const definitions = definitionsList(n.definition);
                
                // Can probable be refactored to be a bit more elegant... :/ 
                const defaultCreateSyntax = `CREATE TABLE ${tableName} (${LINE_END}${definitions}${LINE_END})`;
                const createTableFromSelect = `CREATE TABLE ${tableName} AS${LINE_END}${definitions}${LINE_END}`;
                
                return containsSelect(definitions) ? createTableFromSelect 
                                                   : defaultCreateSyntax;
            }
            return ``;
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
        expression : (n) => {
            const m = mapr(generator);
            return `${n.name}(${m(n.columns)})`;
        }
    },
    literal : {
        text : (n) => `'${n.value}'`,
        decimal : (n) => `${n.value}`,
        null : () => 'NULL'
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
        },
        cast : (n) => {
            const recurser = recurse(generator);
            const expression = recurser(n.expression);
            const as = recurser(n.as);
            const alias = n.alias;
            return `CAST(${expression} AS ${as}) AS [${alias}]`;
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
            
            // Its a select subquery
            if (containsSelect(source)){
                const subquery = `(${source}) AS ${sourceAlias}${LINE_END}${join}`;
                return subquery;
            }
            // Its an inner join.
            return `${source}${LINE_END}${join}`;
        }
    },
    join : {
        join : (n) => {
            const recurser = recurse(generator);
            const source = recurser(n.source);
            const constraint = recurser(n.constraint);
            return `${INDENT}JOIN ${source}${LINE_END}${constraint}`;
        },
        'inner join' : (n) => {
            const recurser = recurse(generator);
            const source = recurser(n.source);
            const sourceAlias = (n.source.alias)? ` AS ${n.source.alias}` : '';
            const constraint = recurser(n.constraint);
            return `${INDENT}INNER JOIN (${source})${sourceAlias}${LINE_END}${constraint}`;
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
        },
        'foreign key' : (n) => {
            const recurser = recurse(generator);
            const ref = recurser(n.references);
            return `REFERENCES ${ref}`;
        },
        'null' : () => 'NULL'
    },
    definition : {
        column : (n) => {
            const recurser = recurse(generator);
            const datatype = isArrayLike(n.datatype) ? mapr(generator, n.datatype) : recurser(n.datatype);
            const constraintsList = compose(join(' '), map(recurser));
            const constraints = constraintsList(n.definition);
            return `${n.name} ${datatype} ${constraints}`;
        },
        constraint : (n) => {
            const recurser = recurse(generator);
            
            const checkConstraint = (type) => (n) => {
                if (isEmpty(n)) { return F;}
                const constraintType = compose(prop('variant'), head);
                return equals(constraintType(n), type);
            };
            const isForeignKey = checkConstraint('foreign key');
            const isPrimaryKey = checkConstraint('primary key');
    
            if(isForeignKey(n.definition)){
                const childKey = recurser(head(n.columns));
                const parentKey = recurser(head(n.definition));
                return `FOREIGN KEY (${childKey}) ${parentKey}`;
            }
            if(isPrimaryKey(n.definition)){
                const field = recurser(head(n.columns));
                const conflict = prop('conflict', head(n.definition));
                return `PRIMARY KEY (${field}) ON CONFLICT ${conflict}`;
            }
            return recurser(head(n.definition));
        }
    },
    datatype : {
        int : datatype,
        varchar : (n) => {
            const arg = recurse(generator)(n.args);
            return `${n.variant}(${arg})`;
        },
        blob : datatype,
        double : datatype,
        int8 : datatype,
        text : datatype,
        tinyint : datatype,
        smallint : datatype,
        mediumint :datatype,
        bigint : datatype,
        int4 : datatype,
        integer : datatype,
        time : datatype,
        timestamp : datatype,
        datetime : datatype,
        date : datatype,
        boolean : datatype,
        decimal : (n) => {
            const arg = recurse(generator)(n.args);
            return `${n.variant}(${arg})`;
        },
        numeric : datatype,
        real : datatype,
        float : datatype,
        'double precision' : datatype,
        clob : (n) => {
            const arg = recurse(generator)(n.args);
            return `${n.variant}(${arg})`;
        },
        longtext : datatype,
        mediumtext : datatype,
        tinytext : datatype,
        char : (n) => {
            const arg = recurse(generator)(n.args);
            return `${n.variant}(${arg})`;
        },
        nvarchar : (n) => {
            const arg = recurse(generator)(n.args);
            return `${n.variant}(${arg})`;
        }
        
    }
};

module.exports = {
    version         : require('./package.json').version,
    generate        : (n) => generator[n.type][n.variant](n)
};