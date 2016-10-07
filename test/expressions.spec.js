import generateExpression from '../src/expressions'
import { expect } from 'chai';

describe('Expressions', () => {
    it('generates a binary expression', () => {
        var expression = {
            "type": "expression",
            "format": "binary",
            "variant": "operation",
            "operation": "=",
            "left": {
                "type": "expression",
                "format": "binary",
                "variant": "operation",
                "operation": "=",
                "left": {
                    "type": "identifier",
                    "variant": "column",
                    "name": "color"
                },
                "right": {
                    "type": "literal",
                    "variant": "string",
                    "value": "red"
                }
            },
            "right": {
                "type": "expression",
                "format": "binary",
                "variant": "operation",
                "operation": "=",
                "left": {
                    "type": "identifier",
                    "variant": "column",
                    "name": "color"
                },
                "right": {
                    "type": "literal",
                    "variant": "string",
                    "value": "red"
                }
            }
        };
        
        console.log(generateExpression(expression));
        expect('').to.be.a('string');
    })
})