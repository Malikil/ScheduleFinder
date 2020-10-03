const db = require('../data-manager');

/**
 * @param {string[]} args 
 * @returns {boolean}
 */
function validate(args) {
    // There should be 2 or 3 args
    if (args.length !== 2)
        return false;
    // Second arg should be "on" or "off"
    if (args[1] !== "on" && args[1] !== "off")
        return false;
    return true;
}

/**
 * @param {string[]} args 
 */
module.exports = function(args) {
    // Make sure the args are correct
    if (!validate(args))
    {
        console.log('Sets the state for a given name.');
        console.log('set <name> <on|off>');
        return;
    }

    db.addStatus(...args);
    db.commit();
    console.log(`Updated ${args[0]}'s state to ${args[1]}`);
}
