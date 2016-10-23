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

const defaultGenerator = {
    statement : {
        list : (node, state) => {
            const mapList = map((n) => defaultGenerator[n.type][n.variant](n, state));
            return join('\n',mapList(node.statement));
        },
        select : (node, state) => {
            const mapList = map((n) => defaultGenerator[n.type][n.variant](n, state));
            const argsList = compose(join(', '), mapList);
            var str = ['SELECT '];
            if (node.result) {
                const results = argsList(node.result);
                str.push(`${results}${state.lineEnd}`);
            }
            if (node.from) {
                const from = defaultGenerator[node.from.type][node.from.variant](node.from, state);
                str.push(`${state.indent}FROM ${from}${state.lineEnd}`);
            }
            if (node.where) {
                const whereNode = head(node.where);
                const where = defaultGenerator[whereNode.type][whereNode.variant](whereNode, state);
                str.push(`${state.indent}WHERE ${where}${state.lineEnd}`);
            }
            if (node.group) {
                const group = defaultGenerator[node.group.type][node.group.variant](node.group, state);
                str.push(`${state.indent}GROUP BY ${group}${state.lineEnd}`);
            }
            if (node.having) {
                const having = defaultGenerator[node.having.type][node.having.variant](node.having, state);
                str.push(`${state.indent}HAVING ${having}${state.lineEnd}`);
            }
            if (node.order) {
                const orderNode = head(node.order);
                const order = defaultGenerator[orderNode.type][orderNode.variant](orderNode, state);
                str.push(`${state.indent}ORDER BY ${order}${state.lineEnd}`);
            }
            if (node.limit) {
                const limit = defaultGenerator[node.limit.type][node.limit.variant](node.limit, state);
                str.push(`${state.indent}${limit}`);
            }
            return str.join('');
        },
        compound : (node, state) => {
            const firstStatement = defaultGenerator[node.statement.type][node.statement.variant](node.statement, state);
            
            const compoundMap = map((n) => defaultGenerator[n.type][n.variant](n, state));
            const compound = compoundMap(node.compound);
            return `${firstStatement}${compound}`;
        }
    },
    compound : {
        union : (node, state) => {
            const statement = defaultGenerator[node.statement.type][node.statement.variant](node.statement, state);
            return `${node.variant.toLocaleUpperCase()}${state.lineEnd}${statement}`;
        },
        get 'union all'(){
            return this.union;
        }
    },
    identifier : {
        star : () => '*',
        table : (node) => {
            return (node.alias)  ? `\`${node.name}\` ${node.alias}` 
                                 : `${node.name}`;
            
        },
        column : (node) => node.name,
        'function' : (node) => node.name,
    },
    literal : {
        text : (node) => `'${node.value}'`,
        decimal : (node) => `${node.value}`
    },
    expression : {
        operation : (node, state) => {
            function side (node, state) {
                return (node.type === 'function') ? defaultGenerator['function'](node, state) 
                                                  : defaultGenerator[node.type][node.variant](node, state);
            }
            const left = side(node.left, state);
            const right = side(node.right, state);
            return `(${left} ${node.operation} ${right})`;
        },
        list : (node, state) => {
            const mapList = map((n) => defaultGenerator[n.type][n.variant](n, state));
            const argsList = compose(join(', '), mapList);
            return argsList(node.expression);
        },
        order : (node, state) => {
            const expression = defaultGenerator[node.expression.type][node.expression.variant](node.expression, state);
            const direction = node.direction;
            return `${expression} ${direction.toLocaleUpperCase()}`;
        },
        limit : (node, state) => {
            const limit = defaultGenerator[node.start.type][node.start.variant](node.start, state);
            const offset = defaultGenerator[node.offset.type][node.offset.variant](node.offset, state);
            return `LIMIT ${limit}${state.lineEnd}${state.indent}OFFSET ${offset}`;
        }
    },
    'function' : (node, state) => {
        const name = defaultGenerator[node.name.type][node.name.variant](node.name, state);
        const args = defaultGenerator[node.args.type][node.args.variant](node.args, state);
        
        return `${name.toLocaleUpperCase()}(${args})`;
    },
    map : {
        join : (node, state) => {
            const source = defaultGenerator[node.source.type][node.source.variant](node.source, state);
            const sourceAlias = (node.source.alias)? node.source.alias : '';
            const joinNode = head(node.map);
            const join = defaultGenerator[joinNode.type][joinNode.variant](joinNode, state);
            return `(${source}) AS ${sourceAlias}${state.lineEnd}${join}`;
        }
    },
    
    join : {
        join : (node, state) => {
            const source = defaultGenerator[node.source.type][node.source.variant](node.source, state);
            const constraint = defaultGenerator[node.constraint.type][node.constraint.variant](node.constraint, state);
            
            return `${state.indent}JOIN ${source}${state.lineEnd}${constraint}`;
        }
    },
    constraint : {
        join : (node, state) => {
            const on = defaultGenerator[node.on.type][node.on.variant](node.on, state);
            return `${state.indent}ON ${on}${state.lineEnd}`;
        }
    }
};

class Stream {

	constructor() {
		this.data = '';
	}
	
	write( string ) {
		this.data += string;
	}

	toString() {
		return this.data;
	}

}

function generate( node, options ) {
	/*
	Returns a string representing the rendered code of the provided AST `node`.
	The `options` are:
	- `indent`: string to use for indentation (defaults to `\t`)
	- `lineEnd`: string to use for line endings (defaults to `\n`)
	- `startingIndentLevel`: indent level to start from (default to `0`)
	- `output`: output stream to write the rendered code to (defaults to `null`)
	- `generator`: custom code generator (defaults to `defaultGenerator`)
	*/
	const state = options == null ? {
		output: new Stream(),
		generator: defaultGenerator,
		indent: '\t',
		lineEnd: '\n',
		indentLevel: 0,
	} : {
		// Functional options
		output: options.output ? options.output : new Stream(),
		generator: options.generator ? options.generator : defaultGenerator,
		// Formating options
		indent: options.indent != null ? options.indent : '\t',
		lineEnd: options.lineEnd != null ? options.lineEnd : '\n',
		indentLevel: options.startingIndentLevel != null ? options.startingIndentLevel : 0
	};
	// Travel through the AST node and generate the code
	return state.generator[node.type][node.variant]( node, state );
// 	const { output } = state
// 	return output.data != null ? output.data : output
}

module.exports = {
    version         : require('./package.json').version,
    generate        : generate
};