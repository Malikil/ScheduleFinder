const set = require('./set');

/**
 * @param {string[]} args 
 * @returns {boolean}
 */
function validate(args) {
    // There should be 2 or 3 args
    if (args.length < 2 || args.length > 3)
        return false;
    // Second arg should be "on" or "off"
    let status = args[1].toLowerCase();
    if (status !== "on" && status !== "off")
        return false;
    // If there's a third argument, it should be a time
    if (args.length === 3 && !(Date.parse(args[2])))
        return false;
    return true;
}

/**
 * @param {string[]} args 
 */
function setmany(args) {
    if (!validate(args))
    {
        console.log('Sets the online state for a given name. ' +
            'A time can be provided, otherwise the current time will be used');
        console.log('setmany "<names>" <on|off> [time]');
        console.log('Names should be separated by spaces, with quotes around the entire list');
        console.log('Format time acording to RFC 3339, ie yyyy-MM-ddThh:mm:ssZ style');
        return;
    }

    let names = args[0].split(' ');
    if (args.length === 3)
        names.forEach(name => set([name, args[1], args[2]]));
    else
        names.forEach(name => set([name, args[1]]));
}

module.exports = setmany;