const db = require('../data-manager');

/**
 * @param {string[]} args 
 */
module.exports = function(args) {
    if (args.length !== 2 || !db.rename(args[0], args[1]))
    {
        console.log("Changes the name of one item");
        console.log("rename <from> <to>");
    }
    else
    {
        db.commit();
        console.log(`Renamed ${args[0]} to ${args[1]}`);
    }
}