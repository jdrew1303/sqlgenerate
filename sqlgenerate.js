'use strict';

// Needed to allow its use in older versions of Node and Browsers.
import 'babel-polyfill';
import {map, join, head, compose, curry, toUpper, prop, equals, isEmpty, F, isArrayLike, concat, __, pluck, contains} from 'ramda';
import {} from 'underscore.string.fp';

const INDENT = '\t';
const LINE_END = '\n';

// This allows calling a function recursivly based on node type. Some of the 
// nodes have non-standard types and so we need to modify how we call the 
// generator.
const recurse = curry((generator, n) => {
    switch (n.type) {
        case 'function':
            return generator['function'](n);
        case 'assignment':
            return generator.assignment(n);
        default:
            return generator[n.type][n.variant](n);
    }
});

const mapr = compose(map, recurse);

const datatype = (n) => n.variant;
const returnNewLine = join('\n');
const joinList = join(', ');
const terminateStatements = map(concat(__, ';'));
const containsSelect = (s) => (s.indexOf('SELECT') !== -1);
const isOfFormat = (n) => compose(equals(n), prop('format'));

const generator = {
    assignment : (n) => {
        const recurser = recurse(generator);
        const target = recurser(n.target);
        const value = recurser(n.value);
        return `${target} = ${value}`;
    },
    statement : {
        list : (n) => {
            const recourseOverList = mapr(generator);
            const statements = compose(returnNewLine, terminateStatements, recourseOverList);
            return statements(n.statement);
        },
        select : (n) => {
            const recurser = recurse(generator);
            const recourseList = mapr(generator);
            const argsList = compose(joinList, recourseList);
            
            var str = [''];
            if (n.with) {
                const withS = recourseList(n.with);
                const isRecursive = (n) => isArrayLike(n) ? compose(contains('recursive'), pluck('variant'))(n) : F;
                const w = isRecursive(n.with) ? 'WITH RECURSIVE' : 'WITH';
                str.push(`${w} ${withS}${LINE_END}`);
            }
            str.push('SELECT ');
            if (n.result) {
                const results = argsList(n.result);
                str.push(`${results}${LINE_END}`);
            }
            if (n.from) {
                const from = recurser(n.from);
                str.push(`${INDENT}FROM (${from})${LINE_END}`);
            }
            if (n.where) {
                const where = recurser(head(n.where));
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
            const statement = recurse(generator)(n.statement);
            const compound = mapr(generator)(n.compound);
            return `${statement}${compound}`;
        },
        create : (n) => {
            const recurser = recurse(generator);
            const isCreateIndex = isOfFormat('index');
            const isCreateTable = isOfFormat('table');
            const isCreateView = isOfFormat('view');
            
            if(isCreateView(n)){
                const viewName = recurser(n.target);
                const result = recurser(n.result);
                
                return `CREATE VIEW ${viewName}${LINE_END}AS ${result}`;
            }
            
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
        },
        insert : (n) => {
            const recurser = recurse(generator);
            const into = recurser(n.into);
            
            // This is an insert into default values
            if (n.result.variant === 'default'){ 
                return `INSERT INTO ${into}${LINE_END}DEFAULT VALUES`;
            }
            // This is an insert into select
            if (n.result.variant === 'select'){ 
                const result = recurser(n.result);
                return `INSERT INTO ${into}${LINE_END}${result}`;
            }
            // Otherwise we build up the values to be inserted
            const addBrackets = map((s) => `(${s})`);
            const valuesList = compose(join(`,${LINE_END}`), addBrackets, mapr(generator));
            const result = valuesList(n.result);
            return `INSERT INTO ${into}${LINE_END}VALUES ${result}`;
        },
        'delete' : (n) => {
            const recurser = recurse(generator);
            
            var str = ['DELETE '];
            
            if (n.from) {
                const from = recurser(n.from);
                str.push(`${INDENT}FROM ${from}${LINE_END}`);
            }
            if (n.where) {
                const whereNode = head(n.where);
                const where = recurser(whereNode);
                str.push(`${INDENT}WHERE ${where}${LINE_END}`);
            }
            if (n.limit) {
                const limit = recurser(n.limit);
                str.push(`${INDENT}${limit}`);
            }
            return str.join('');
        },
        drop : (n) => {
            const recurser = recurse(generator);
            const target = recurser(n.target);
            return `DROP ${n.format} ${target}`;
        },
        update : (n) => {
            const recurser = recurse(generator);
            const into = recurser(n.into);
            const setS = mapr(generator)(n.set);
            var str = [`UPDATE ${into} SET ${setS}`];
            
            if (n.where) {
                const whereNode = head(n.where);
                const where = recurser(whereNode);
                str.push(`${INDENT}WHERE ${where}${LINE_END}`);
            }
            if (n.limit) {
                const limit = recurser(n.limit);
                str.push(`${INDENT}${limit}`);
            }
            
            return str.join('');
        }
    },
    compound : {
        union : (n) => {
            const statement = recurse(generator)(n.statement);
            return `${toUpper(n.variant)}${LINE_END}${statement}`;
        },
        get 'union all'(){
            return this.union;
        },
        get 'except'(){
            return this.union;
        },
        get 'intersect'(){
            return this.union;
        },
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
            return `\`${n.name}\` ${alias} ${index}`;
        },
        'function' : (n) => n.name,
        expression : (n) => {
            const m = mapr(generator);
            return `\`${n.name}\`(${m(n.columns)})`;
        },
        view : (n) => n.name
    },
    literal : {
        text : (n) => `'${n.value}'`,
        decimal : (n) => `${n.value}`,
        null : () => 'NULL'
    },
    expression : {
        operation : (n) => {
            const recurser = recurse(generator);
            const isUnaryOperation = isOfFormat('unary');
            if(isUnaryOperation(n)){
                const expression = recurser(n.expression);
                const operator = (n.operator) ? `${n.operator}` : '';
                const alias = (n.alias) ? `AS [${n.alias}]` : '';
                return `${operator} ${expression} ${alias}`;
            }
            const leftOp = recurser(n.left);
            const left = containsSelect(leftOp)? `(${leftOp})` : leftOp;
            const rightOp = recurser(n.right);
            const right = containsSelect(rightOp)? `(${rightOp})` : rightOp;
            return `(${left} ${n.operation} ${right})`;
        },
        list : (n) => {
            const argsList = compose(joinList, mapr(generator));
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
            const alias = (n.alias) ? `AS [${n.alias}]` : '';
            return `CAST(${expression} AS ${as})${alias}`;
        },
        common : (n) => {
            const recurser = recurse(generator);
            const expression = recurser(n.expression);
            const target = recurser(n.target);
            return `${target} AS (${expression})`;
        },
        'case' : (n) => {
            // This is a hack until the ast is standardised. 
            // May have to use this in other areas until then.
            const gen = (n) => generator[n.type][n.format](n);
            const mapConditions = compose(join(LINE_END), map(gen));
            const conditions = mapConditions(n.condition);
            const alias = (n.alias) ? `AS [${n.alias}]` : '';
            return `CASE ${conditions} END ${alias}`;
        },
        recursive : (n) => {
            const recurser = recurse(generator);
            const target = recurser(n.target);
            const expression = recurser(n.expression);
            return `${target} AS (${expression})`;
        }
    },
    condition : {
        when : (n) => {
            const recurser = recurse(generator);
            const when = recurser(n.when);
            const then = recurser(n.then);
            return `WHEN ${when} THEN ${then}`;
        },
        'else' : (n) => {
            const recurser = recurse(generator);
            const elseS = recurser(n.else);
            return `ELSE ${elseS}`;
        }
    },
    'function' : (n) => {
        const recurser = recurse(generator);
        const name = toUpper(recurser(n.name));
        const args = recurser(n.args);
        const alias =  (n.alias)  ? `AS \`${n.alias}\`` : '';
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
                const subquery = `(${source}) AS ${sourceAlias} ${join}`;
                return subquery;
            }
            // Its an inner join.
            return `${source} ${join}`;
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
        },
        'left outer join' : (n) => {
            const recurser = recurse(generator);
            const source = recurser(n.source);
            const constraint = recurser(n.constraint);
            return `${INDENT}LEFT OUTER JOIN ${source}${LINE_END}${constraint}`;
        },
        'cross join' : (n) => {
            const recurser = recurse(generator);
            const source = recurser(n.source);
            return `, ${source}`;
        }
    },
    constraint : {
        join : (n) => {
            const isFormatUsing = isOfFormat('using');
            const isFormatOn = isOfFormat('on');
            
            const recurser = recurse(generator);
            if(isFormatOn(n)){
                const on = recurser(n.on);
                return `${INDENT}ON ${on}${LINE_END}`;
            }
            if(isFormatUsing(n)){
                const using = mapr(generator)(n.using.columns);
                return `${INDENT}USING (${using})${LINE_END}`;
            }
            return '';
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