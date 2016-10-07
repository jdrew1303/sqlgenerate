function generateExpression (node) {
    var result = []
    
    switch (node.operation) {
        case '=':
            var left = '';
            switch (node.left.type) {
                case 'expression':
                    left = generateExpression(node.left, node);
                    break;
                case 'identifier':
                    left = node.left.name
                    break;
                case 'literal':
                    left = node.left.variant === 'string' ? `'${node.left.value}'` : node.left.value;
                    break;    
                default:
                    // code
            }
            
            var right = '';
            switch (node.right.type) {
                case 'expression':
                    right = generateExpression(node.right, node);
                    break;
                case 'identifier':
                    right = node.right.name
                    break;
                case 'literal':
                    right = node.right.variant === 'string' ? `'${node.right.value}'` : node.right.value;
                    break;    
                default:
                    // code
            }
            
            return `(${left} ${node.operation} ${right})`
            break;
        
        default:
            return [];
    }
}

module.exports = generateExpression;