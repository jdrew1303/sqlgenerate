'use strict';

// Needed to allow its use in older versions of Node and Browsers.
import 'babel-polyfill';
import {map, join, head, compose, toUpper, prop, equals, isEmpty, F, isArrayLike, concat, __, pluck, contains, is} from 'ramda';
import {} from 'underscore.string.fp';

const INDENT = '\t';
const LINE_END = '\n';

function visit(ast) {
    if (is(String, ast)) { return ast; }
    const hasNoVariant = contains(__, ['function', 'module', 'assignment', 'event']);
    const g = hasNoVariant(ast.type) ? Generator[ast.type] : Generator[ast.type][ast.variant];
    if (g == null) {throw Error('Unsupported type: ' + ast.type);}
    return g(ast);
}

const visitList = map(visit);

const datatype = (n) => n.variant;
const returnNewLine = join('\n');
const joinList = join(', ');
const terminateStatements = map(concat(__, ';'));
const containsSelect = (s) => (s.indexOf('SELECT') !== -1);
const isOfFormat = (n) => compose(equals(n), prop('format'));
const argsList = compose(joinList, visitList);
const datatypeWithArgs = (n) => `${n.variant}(${visit(n.args)})`;


var Generator = {
    assignment : (n) => {
        const target = visit(n.target);
        const value = visit(n.value);
        return `${target} = ${value}`;
    },
    statement : {
        list : (n) => {
            const statements = compose(returnNewLine, terminateStatements, visitList);
            return statements(n.statement);
        },
        select : (n) => {
            var str = [''];
            if (n.with) {
                const withS = visitList(n.with);
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
                const from = visit(n.from);
                str.push(`${INDENT}FROM (${from})${LINE_END}`);
            }
            if (n.where) {
                const where = visit(head(n.where));
                str.push(`${INDENT}WHERE ${where}${LINE_END}`);
            }
            if (n.group) {
                const group = visit(n.group);
                str.push(`${INDENT}GROUP BY ${group}${LINE_END}`);
            }
            if (n.having) {
                const having = visit(n.having);
                str.push(`${INDENT}HAVING ${having}${LINE_END}`);
            }
            if (n.order) {
                const order = visit(head(n.order));
                str.push(`${INDENT}ORDER BY ${order}${LINE_END}`);
            }
            if (n.limit) {
                const limit = visit(n.limit);
                str.push(`${INDENT}${limit}`);
            }
            return str.join('');
        },
        compound : (n) => {
            const statement = visit(n.statement);
            const compound = visitList(n.compound);
            return `${statement}${compound}`;
        },
        create : (n) => {
            const isCreateIndex = isOfFormat('index');
            const isCreateTable = isOfFormat('table');
            const isCreateView = isOfFormat('view');
            const isCreateVirtual = isOfFormat('virtual');
            const isCreateTrigger = isOfFormat('trigger');
            
            if(isCreateTrigger(n)){
                const target = visit(n.target);
                const by = n.by ? `FOR EACH ${n.by}` : '';
                const event = visit(n.event);
                const on = visit(n.on);
                const action = compose(join(';\n'), visitList)(n.action);
                const when = visit(n.when);
                const temporary = (!!n.temporary) ? 'TEMPORARY' : '';
                const condition = (n.condition) ? visitList(n.condition) : '';
                return `CREATE ${temporary} TRIGGER ${condition} ${target} ${event} ON ${on} ${by} WHEN ${when} BEGIN ${action}; END`;
            }
            
            if(isCreateVirtual(n)){
                const target = visit(n.target);
                const result = visit(n.result);
                return `CREATE VIRTUAL TABLE ${target} USING ${result}`;
            }
            
            if(isCreateView(n)){
                const viewName = visit(n.target);
                const result = visit(n.result);
                return `CREATE VIEW ${viewName}${LINE_END}AS ${result}`;
            }
            
            if (isCreateIndex(n)) {
                const indexName = n.target.name;
                const onColumns = visit(n.on);
                const where = visit(head(n.where));
                return `CREATE INDEX ${indexName}${LINE_END}ON ${onColumns}${LINE_END}WHERE ${where}`;
            }
            
            if (isCreateTable(n)) {
                const tableName = visit(n.name);
                const definitionsList = compose(join(`,${LINE_END}`), visitList);
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
            const into = visit(n.into);
            
            // This is an insert into default values
            if (n.result.variant === 'default'){ 
                return `INSERT INTO ${into}${LINE_END}DEFAULT VALUES`;
            }
            // This is an insert into select
            if (n.result.variant === 'select'){ 
                const result = visit(n.result);
                return `INSERT INTO ${into}${LINE_END}${result}`;
            }
            // Otherwise we build up the values to be inserted
            const addBrackets = map((s) => `(${s})`);
            const valuesList = compose(join(`,${LINE_END}`), addBrackets, visitList);
            const result = valuesList(n.result);
            return `INSERT INTO ${into}${LINE_END}VALUES ${result}`;
        },
        'delete' : (n) => {
            var str = ['DELETE '];
            
            if (n.from) {
                const from = visit(n.from);
                str.push(`${INDENT}FROM ${from}${LINE_END}`);
            }
            if (n.where) {
                const whereNode = head(n.where);
                const where = visit(whereNode);
                str.push(`${INDENT}WHERE ${where}${LINE_END}`);
            }
            if (n.limit) {
                const limit = visit(n.limit);
                str.push(`${INDENT}${limit}`);
            }
            return str.join('');
        },
        drop : (n) => {
            const condition = (n.condition.length > 0) ? visitList(n.condition) : '';
            const target = visit(n.target);
            return `DROP ${n.format} ${condition} ${target}`;
        },
        update : (n) => {
            const into = visit(n.into);
            const setS = visitList(n.set);
            var str = [`UPDATE ${into} SET ${setS}`];
            
            if (n.where) {
                const whereNode = head(n.where);
                const where = visit(whereNode);
                str.push(`${INDENT}WHERE ${where}${LINE_END}`);
            }
            if (n.limit) {
                const limit = visit(n.limit);
                str.push(`${INDENT}${limit}`);
            }
            
            return str.join('');
        },
        transaction : (n) => {
            const isOfActionType = (type) => (action) => (action === type); 
            const isBegin = isOfActionType('begin');
            const isRollback = isOfActionType('rollback');
            
            if (isBegin(n.action)){
                return `${n.action} ${n.defer} TRANSACTION`;
            }
            if (isRollback(n.action)){
                return `ROLLBACK TRANSACTION TO SAVEPOINT ${n.savepoint.name}`;
            }
            return `COMMIT`;
        },
        release : (n) => {
            const savepoint = visit(n.target.savepoint);
            return `RELEASE SAVEPOINT ${savepoint}`;
        },
        savepoint : (n) => {
            const savepoint = visit(n.target.savepoint);
            return `SAVEPOINT ${savepoint}`;
        }
    },
    compound : {
        union : (n) => {
            const statement = visit(n.statement);
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
            const index = (n.index) ? visit(n.index) : '';
            return `\`${n.name}\` ${alias} ${index}`;
        },
        index : (n) => `INDEXED BY ${n.name}`,
        column : (n) => {
            const alias =  (n.alias) ? `AS \`${n.alias}\`` : '';
            const index = (n.index) ? visit(n.index) : '';
            return `\`${n.name}\` ${alias} ${index}`;
        },
        'function' : (n) => n.name,
        expression : (n) => {
            const m = visitList;
            return `\`${n.name}\`(${m(n.columns)})`;
        },
        view : (n) => n.name,
        savepoint : (n) => n.name,
        trigger : (n) => `"${n.name}"`
    },
    literal : {
        text : (n) => `'${n.value}'`,
        decimal : (n) => `${n.value}`,
        null : () => 'NULL'
    },
    expression : {
        operation : (n) => {
            const isUnaryOperation = isOfFormat('unary');
            
            if(isUnaryOperation(n)){
                const expression = visit(n.expression);
                const operator = (n.operator) ? `${n.operator}` : '';
                const alias = (n.alias) ? `AS [${n.alias}]` : '';
                return `${operator} ${expression} ${alias}`;
            }
            
            const isBetween = (n) => (n.operation === 'between');
            const isExpression = (n) => (n.type === 'expression');
            
            const side = (s) => {
                const sideOp = visit(n[s]);
                return !isBetween(n) && (isExpression(n[s]) || containsSelect(sideOp)) ? `(${sideOp})` : sideOp;
            };
            const left = side('left');
            const right = side('right');
            
            return `${left} ${n.operation} ${right}`;
        },
        list : (n) => {
            const argsList = compose(joinList, visitList);
            return argsList(n.expression);
        },
        order : (n) => {
            const expression = visit(n.expression);
            const direction = n.direction;
            return `${expression} ${toUpper(direction)}`;
        },
        limit : (n) => {
            const limit = visit(n.start);
            const offset = visit(n.offset);
            return `LIMIT ${limit}${LINE_END}${INDENT}OFFSET ${offset}`;
        },
        cast : (n) => {
            const expression = visit(n.expression);
            const as = visit(n.as);
            const alias = (n.alias) ? `AS [${n.alias}]` : '';
            return `CAST(${expression} AS ${as})${alias}`;
        },
        common : (n) => {
            const expression = visit(n.expression);
            const target = visit(n.target);
            return `${target} AS (${expression})`;
        },
        'case' : (n) => {
            const mapConditions = compose(join(LINE_END), visitList);
            const conditions = mapConditions(n.expression);
            const alias = (n.alias) ? `AS [${n.alias}]` : '';
            return `CASE ${conditions} END ${alias}`;
        },
        recursive : (n) => {
            const target = visit(n.target);
            const expression = visit(n.expression);
            return `${target} AS (${expression})`;
        },
        exists : (n) => n.operator
    },
    condition : {
        when : (n) => {
            const when = visit(n.condition);
            const then = visit(n.consequent);
            return `WHEN ${when} THEN ${then}`;
        },
        'else' : (n) => {
            const elseS = visit(n.consequent);
            return `ELSE ${elseS}`;
        },
        'if' : (n) => {
            const exists = visit(n.condition);
            return `IF ${exists}`;
        }
    },
    'function' : (n) => {
        const name = toUpper(visit(n.name));
        const args = visit(n.args);
        const alias =  (n.alias)  ? `AS \`${n.alias}\`` : '';
        return `${name}(${args}) ${alias}`;
    },  
    module : (n) => {
        const args = visit(n.args);
        const alias =  (n.alias)  ? `AS \`${n.alias}\`` : '';
        return `${n.name}(${args}) ${alias}`;
    }, 
    event : ({event, occurs, of}) => {
        const processedOf = (of) ? `OF ${visitList(of)}` : '';
        return `${occurs} ${event} ${processedOf}`;
    },
    map : {
        join : (n) => {
            const source = visit(n.source);
            const sourceAlias = (n.source.alias)? n.source.alias : '';
            const join = visit(head(n.map));
            
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
            const source = visit(n.source);
            const constraint = visit(n.constraint);
            return `${INDENT}JOIN ${source}${LINE_END}${constraint}`;
        },
        'inner join' : (n) => {
            const source = visit(n.source);
            const sourceAlias = (n.source.alias)? ` AS ${n.source.alias}` : '';
            const constraint = visit(n.constraint);
            return `${INDENT}INNER JOIN (${source})${sourceAlias}${LINE_END}${constraint}`;
        },
        'left outer join' : (n) => {
            const source = visit(n.source);
            const constraint = visit(n.constraint);
            return `${INDENT}LEFT OUTER JOIN ${source}${LINE_END}${constraint}`;
        },
        'cross join' : (n) => {
            const source = visit(n.source);
            return `, ${source}`;
        }
    },
    constraint : {
        join : (n) => {
            const isFormatUsing = isOfFormat('using');
            const isFormatOn = isOfFormat('on');
            if(isFormatOn(n)){
                const on = visit(n.on);
                return `${INDENT}ON ${on}${LINE_END}`;
            }
            if(isFormatUsing(n)){
                const using = visitList(n.using.columns);
                return `${INDENT}USING (${using})${LINE_END}`;
            }
            return '';
        },
        'primary key' : () => `PRIMARY KEY`,
        'not null': () => `NOT NULL`,
        unique : () => `UNIQUE`,
        check : (n) => {
            const check = visit(n.expression);
            return `CHECK (${check})`;
        },
        'foreign key' : (n) => {
            const ref = visit(n.references);
            return `REFERENCES ${ref}`;
        },
        'null' : () => 'NULL'
    },
    definition : {
        column : (n) => {
            const datatype = isArrayLike(n.datatype) ? visitList(Generator, n.datatype) : visit(n.datatype);
            const constraintsList = compose(join(' '), map(visit));
            const constraints = constraintsList(n.definition);
            return `${n.name} ${datatype} ${constraints}`;
        },
        constraint : (n) => {
            const checkConstraint = (type) => (n) => {
                if (isEmpty(n)) { return F;}
                const constraintType = compose(prop('variant'), head);
                return equals(constraintType(n), type);
            };
            const isForeignKey = checkConstraint('foreign key');
            const isPrimaryKey = checkConstraint('primary key');
    
            if(isForeignKey(n.definition)){
                const childKey = visit(head(n.columns));
                const parentKey = visit(head(n.definition));
                return `FOREIGN KEY (${childKey}) ${parentKey}`;
            }
            if(isPrimaryKey(n.definition)){
                const childKey = visit(head(n.columns));
                const conflict = prop('conflict', head(n.definition));
                return `PRIMARY KEY (${childKey}) ON CONFLICT ${conflict}`;
            }
            return visit(head(n.definition));
        }
    },
    datatype : {
        int : datatype,
        varchar : datatypeWithArgs,
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
        decimal : datatypeWithArgs,
        numeric : datatype,
        real : datatype,
        float : datatype,
        'double precision' : datatype,
        clob : datatypeWithArgs,
        longtext : datatype,
        mediumtext : datatype,
        tinytext : datatype,
        char : datatypeWithArgs,
        nvarchar : datatypeWithArgs
    }
};

module.exports = {
    version         : require('./package.json').version,
    generate        : visit
};