'use strict';

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
                var results = argsList(node.result);
                str.push(`${results}${state.lineEnd}`);
            }
            if (node.from) {
                var from = defaultGenerator[node.from.type][node.from.variant](node.from, state);
                str.push(`${state.indent}FROM ${from}${state.lineEnd}`);
            }
            if (node.where) {
                var whereNode = head(node.where);
                var where = defaultGenerator[whereNode.type][whereNode.variant](whereNode, state);
                str.push(`${state.indent}WHERE ${where}${state.lineEnd}`);
            }
            if (node.group) {
                var group = defaultGenerator[node.group.type][node.group.variant](node.group, state);
                str.push(`${state.indent}GROUP BY ${group}${state.lineEnd}`);
            }
            return str.join('');
        }
    },
    identifier : {
        star : () => '*',
        table : (node) => (node.alias)  ? `${node.name} ${node.alias}` 
                                        : `${node.name}`,
        column : (node) => node.name,
    },
    literal : {
        text : (node) => `'${node.value}'`,
    },
    expression : {
        operation : (node, state) => {
            const left = defaultGenerator[node.left.type][node.left.variant](node.left, state);
            const right = defaultGenerator[node.right.type][node.right.variant](node.right, state);
            return `(${left} ${node.operation} ${right})`;
        },
        list : (node, state) => {
            const mapList = map((n) => defaultGenerator[n.type][n.variant](n, state));
            const argsList = compose(join(', '), mapList);
            return argsList(node.expression);
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