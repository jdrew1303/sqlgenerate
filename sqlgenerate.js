var sqltraverse = require('sqltraverse');



module.exports = {
    version         : require('./package.json').version,
    generate        : function(){},
    attachComments  : sqltraverse.attachComments
};

