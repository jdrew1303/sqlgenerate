'use strict';

// Needed to allow its use in older versions of Node and Browsers.
import 'babel-polyfill';
import {map, join, head, compose, toUpper, prop, equals, isEmpty, F, isArrayLike, concat, __, pluck, contains, is, not} from 'ramda';
import {} from 'underscore.string.fp';

function visit(ast) {
    if (is(String, ast)) { return ast; }
    if (isArrayLike(ast)){ return map(visit, ast); }
    const hasNoVariant = contains(__, ['function', 'module', 'assignment', 'event']);
    const g = hasNoVariant(ast.type) ? Generator[ast.type] : Generator[ast.type][ast.variant];
    if (g == null) {throw Error('Unsupported type: ' + ast.type);}
    return g(ast);
}

const datatype = (n) => n.variant;
const datatypeWithArgs = (n) => `${n.variant}(${visit(n.args)})`;


const joinCommaSeperated = join(', ');
const joinSpace = join(' ');
const joinTerminal = join(';');

const terminateStatements = map(concat(__, ';'));
const argsList = compose(joinCommaSeperated, visit);

const containsSelect = contains('select');
const isOfFormat = (n) => compose(equals(n), prop('format'));

const compound = (n) => `${toUpper(n.variant)}${visit(n.statement)}`;
const name = (n) => `"${n.name}"`;
const possiblyAlias = (alias = false) => alias ? `as \`${alias}\`` : '';

const identifierWithAlias = (n) => {
    const alias =  possiblyAlias(n.alias);
    const index = (n.index) ? visit(n.index) : '';
    return `\`${n.name}\` ${alias} ${index}`;
};



var Generator = {
    assignment : (n) => {
        const target = visit(n.target);
        const value = visit(n.value);
        return `${target} = ${value}`;
    },
    statement : {
        list : (n) => {
            const statements = compose(joinSpace, terminateStatements, visit);
            return statements(n.statement);
        },
        select : (n) => {
            var str = [''];
            if (n.with) {
                const withS = visit(n.with);
                const isRecursive = (n) => isArrayLike(n) ? compose(contains('recursive'), pluck('variant'))(n) : F;
                const w = isRecursive(n.with) ? 'with recursive' : 'with';
                str.push(`${w} ${withS}`);
            }
            str.push('select ');
            if (n.result) {
                const results = argsList(n.result);
                str.push(`${results}`);
            }
            if (n.from) {
                const processedFrom = visit(n.from);
                const from = containsSelect(processedFrom) ? `(${processedFrom})` : processedFrom;
                str.push(`from ${from}`);
            }
            if (n.where) {
                const where = visit(head(n.where));
                str.push(`where ${where}`);
            }
            if (n.group) {
                const group = visit(n.group);
                str.push(`group by ${group}`);
            }
            if (n.having) {
                const having = visit(n.having);
                str.push(`having ${having}`);
            }
            if (n.order) {
                const order = visit(head(n.order));
                str.push(`order by ${order}`);
            }
            if (n.limit) {
                const limit = visit(n.limit);
                str.push(`${limit}`);
            }
            return joinSpace(str);
        },
        compound : (n) => {
            const statement = visit(n.statement);
            const compound = visit(n.compound);
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
                const by = n.by ? `for each ${n.by}` : '';
                const event = visit(n.event);
                const on = visit(n.on);
                const action = compose(joinTerminal, visit)(n.action);
                const when = visit(n.when);
                const temporary = (!!n.temporary) ? 'temporary' : '';
                const condition = (n.condition) ? visit(n.condition) : '';
                return `create ${temporary} trigger ${condition} ${target} ${event} on ${on} ${by} when ${when} begin ${action}; end`;
            }
            
            if(isCreateVirtual(n)){
                const target = visit(n.target);
                const result = visit(n.result);
                return `create virtual table ${target} using ${result}`;
            }
            
            if(isCreateView(n)){
                const viewName = visit(n.target);
                const result = visit(n.result);
                return `create view ${viewName} as ${result}`;
            }
            
            if (isCreateIndex(n)) {
                const indexName = n.target.name;
                const onColumns = visit(n.on);
                const where = visit(head(n.where));
                return `create index ${indexName} on ${onColumns} where ${where}`;
            }
            
            if (isCreateTable(n)) {
                const tableName = visit(n.name);
                const definitionsList = compose(joinCommaSeperated, visit);
                const definitions = definitionsList(n.definition);
                
                // Can probable be refactored to be a bit more elegant... :/ 
                const defaultCreateSyntax = `create table ${tableName} (${definitions})`;
                const createTableFromSelect = `create table ${tableName} as ${definitions}`;
                
                return containsSelect(definitions) ? createTableFromSelect 
                                                   : defaultCreateSyntax;
            }
            return ``;
        },
        insert : (n) => {
            const into = visit(n.into);
            
            // This is an insert into default values
            if (n.result.variant === 'default'){ 
                return `insert into ${into} default values`;
            }
            // This is an insert into select
            if (n.result.variant === 'select'){ 
                const result = visit(n.result);
                return `insert into ${into}${result}`;
            }
            // Otherwise we build up the values to be inserted
            const addBrackets = map((s) => `(${s})`);
            const valuesList = compose(joinCommaSeperated, addBrackets, visit);
            const result = valuesList(n.result);
            return `insert into ${into} values ${result}`;
        },
        'delete' : (n) => {
            var str = ['delete '];
            
            if (n.from) {
                const from = visit(n.from);
                str.push(`from ${from}`);
            }
            if (n.where) {
                const whereNode = head(n.where);
                const where = visit(whereNode);
                str.push(`where ${where}`);
            }
            if (n.limit) {
                const limit = visit(n.limit);
                str.push(`${limit}`);
            }
            return joinSpace(str);
        },
        drop : (n) => {
            const condition = (n.condition.length > 0) ? visit(n.condition) : '';
            const target = visit(n.target);
            return `drop ${n.format} ${condition} ${target}`;
        },
        update : (n) => {
            const into = visit(n.into);
            const setS = visit(n.set);
            var str = [`update ${into} set ${setS}`];
            
            if (n.where) {
                const whereNode = head(n.where);
                const where = visit(whereNode);
                str.push(`where ${where}`);
            }
            if (n.limit) {
                const limit = visit(n.limit);
                str.push(`${limit}`);
            }
            
            return joinSpace(str);
        },
        transaction : (n) => {
            const isOfActionType = (type) => (action) => (action === type); 
            const isBegin = isOfActionType('begin');
            const isRollback = isOfActionType('rollback');
            
            if (isBegin(n.action)){
                return `${n.action} ${n.defer} transaction`;
            }
            if (isRollback(n.action)){
                return `rollback transaction to savepoint ${n.savepoint.name}`;
            }
            return `commit`;
        },
        release : (n) => `release savepoint ${visit(n.target.savepoint)}`,
        savepoint : (n) => `savepoint ${visit(n.target.savepoint)}`
    },
    compound : {
        union : compound,
        'union all' : compound,
        except : compound,
        intersect : compound,
    },
    identifier : {
        star : (n) => n.name,
        table : identifierWithAlias,
        index : ({name}) => `indexed by ${name}`,
        column : identifierWithAlias,
        'function' : (n) => n.name,
        expression : (n) => `"${n.name}"(${visit(n.columns)})`,
        view : name,
        savepoint : name,
        trigger : name
    },
    literal : {
        text : (n) => `'${n.value}'`,
        decimal : (n) => n.value,
        null : () => 'null'
    },
    expression : {
        operation : (n) => {
            const isUnaryOperation = isOfFormat('unary');
            
            if(isUnaryOperation(n)){
                const expression = visit(n.expression);
                const operator = (n.operator) ? `${n.operator}` : '';
                const alias = (n.alias) ? `as [${n.alias}]` : '';
                return `${operator} ${expression} ${alias}`;
            }
            
            const side = (n, s) => {
                const sideOp = visit(n[s]);
                
                const isBetween = (n) => (n.operation === 'between');
                const isExpression = (n) => (n.type === 'expression');
                
                const needsBrackets = (not(isBetween(n)) && (isExpression(n[s]) || containsSelect(sideOp)));
                return needsBrackets ? `(${sideOp})` : sideOp;
            };
            
            const left = side(n, 'left');
            const right = side(n, 'right');
            
            return `${left} ${n.operation} ${right}`;
        },
        list : ({expression}) => argsList(expression),
        order : ({expression, direction}) => `${visit(expression)} ${direction}`,
        limit : ({start, offset}) => `LIMIT ${visit(start)}OFFSET ${visit(offset)}`,
        cast : ({expression, as, alias = false}) => `CAST(${visit(expression)} as ${visit(as)})${possiblyAlias(alias)}`,
        common : ({target, expression}) => `${visit(target)} as (${visit(expression)})`,
        'case' : ({expression, alias = false}) => `case ${joinSpace(visit(expression))} end ${possiblyAlias(alias)}`,
        recursive : ({target, expression}) => `${visit(target)} as (${visit(expression)})`,
        exists : ({operator}) => operator
    },
    condition : {
        when : ({condition, consequent}) => `when ${visit(condition)} then ${visit(consequent)}`,
        'else' : ({consequent}) => `else ${visit(consequent)}`,
        'if' : ({condition}) =>  `if ${visit(condition)}`
    },
    'function' : ({name, args, alias = false}) => `${visit(name)}(${visit(args)}) ${possiblyAlias(alias)}`,
    module : ({name, args, alias = false}) => `${name}(${visit(args)}) ${possiblyAlias(alias)}`, 
    event : ({event, occurs, of}) => {
        const processedOf = (of) ? `of ${visit(of)}` : '';
        return `${occurs} ${event} ${processedOf}`;
    },
    map : {
        join : (n) => {
            const source = visit(n.source);
            const sourceAlias = (n.source.alias)? n.source.alias : '';
            const join = visit(head(n.map));
            
            // Its a select subquery
            if (containsSelect(source)){
                const subquery = `(${source}) as ${sourceAlias} ${join}`;
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
            return `join ${source}${constraint}`;
        },
        'inner join' : (n) => {
            const source = visit(n.source);
            const sourceAlias = (n.source.alias)? ` as ${n.source.alias}` : '';
            const constraint = visit(n.constraint);
            return `inner join (${source})${sourceAlias} ${constraint}`;
        },
        'left outer join' : (n) => {
            const source = visit(n.source);
            const constraint = visit(n.constraint);
            return `left outer join ${source}${constraint}`;
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
                return `on ${on}`;
            }
            if(isFormatUsing(n)){
                const using = visit(n.using.columns);
                return `using (${using})`;
            }
            return '';
        },
        'primary key' : () => 'primary key',
        'not null': () => 'not null',
        unique : () => 'unique',
        check : (n) => {
            const check = visit(n.expression);
            return `check (${check})`;
        },
        'foreign key' : (n) => {
            const ref = visit(n.references);
            return `references ${ref}`;
        },
        'null' : () => 'null'
    },
    definition : {
        column : (n) => {
            const datatype = visit(n.datatype);
            const constraintsList = compose(joinSpace, map(visit));
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
                return `foreign key (${childKey}) ${parentKey}`;
            }
            if(isPrimaryKey(n.definition)){
                const childKey = visit(head(n.columns));
                const conflict = prop('conflict', head(n.definition));
                return `primary key (${childKey}) on conflict ${conflict}`;
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