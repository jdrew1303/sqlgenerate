var sqltraverse = require('sqltraverse');

var templates = {
    
}
var generate = function (ast) {
    var result = [];
    
    sqltraverse.traverse(ast, {
        enter : function (node, parent) {
            // var nodeText = templates[node.type + '_enter'](node, parent);
            // if (nodeText) result.push(nodeText);
        },

        leave : function (node, parent){
            // var nodeText = templates[node.type + '_leave'](node, parent);
            // if (nodeText) result.push(nodeText);
        },
        
        fallback : 'iteration'
    });
    
    return result.join('');
}

module.exports = {
    version         : require('./package.json').version,
    generate        : generate,
    attachComments  : sqltraverse.attachComments
};
