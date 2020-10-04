const db = require('../data-manager');

/**
 * @param {string[]} args 
 */
module.exports = function(args) {
    if (args.length !== 1 || !db.removeName(args[0]))
    {
        console.log("Remove a name from tracking");
        console.log("Only remove 1 name at a time");
        console.log("remove <name>");
    }
    else
    {
        db.commit();
        console.log(`Removed ${args[0]}`);
    }
}