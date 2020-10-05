const { inspect } = require('util');
const db = require('../data-manager');

/**
 * @param {string[]} args 
 */
module.exports = function(args) {
    if (args.length !== 1)
    {
        console.log("Views the raw JSON formatted data associated with the given name");
        console.log("raw <name>");
        return;
    }

    console.log(inspect(db.getDataByName(args[0]), false, 4, true));
}