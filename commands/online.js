const db = require('../data-manager');

/**
 * @param {string[]} args 
 */
module.exports = function(args) {
    if (args.length < 1)
    {
        console.log("Sets the currently online names. Any names online in data " +
            "but not on the list will be set to offline, and vice versa");
        console.log('online <...names>');
        console.log("Names should be separated by spaces");
        return;
    }

    // For convenience, only show names who's state changed
    let currentlyOn = db.getOnStates();
    // Loop through the given names, setting their status to online
    args.forEach(name => {
        db.addStatus(name, 'on');
        if (!currentlyOn.includes(name))
            console.log(`Updated ${name} to on state`);
    });

    // Find which names need to be turned off. Even if they're already off they
    // can be refreshed because they're not in the list
    let leftovers = db.getAllNames().filter(name => !args.includes(name));
    leftovers.forEach(name => {
        db.addStatus(name, 'off');
        if (currentlyOn.includes(name))
            console.log(`Updated ${name} to off state`);
    });
    db.commit();
}
