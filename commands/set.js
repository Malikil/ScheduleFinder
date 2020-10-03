const util = require('util');
//const readline = require('readline');
const fs = require('fs');

// Make sure the data file exists
if (!fs.existsSync('data.json'))
    fs.writeFileSync('data.json', '{}');
/**
 * @type {{
 *  status: "on"|"off",
 *  daily: {
 *      on?: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      },
 *      off?: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      }
 *  },
 *  weekly: {
 *      on: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      },
 *      off: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      }
 *  }[],
 *  monthly: {
 *      on: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      },
 *      off: {
 *          time: number,
 *          count: number,
 *          stdev?: number
 *      }
 *  }[]
 * }[]}
 */
const data = JSON.parse(fs.readFileSync('data.json'));

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
function set(args) {
    // Make sure the args are correct
    if (!validate(args))
    {
        console.log('Sets the online state for a given name. ' +
            'A time can be provided, otherwise the current time will be used');
        console.log('set <name> <on|off> [time]');
        console.log('Format time acording to RFC 3339, ie yyyy-MM-ddThh:mm:ssZ style');
        return;
    }

    // Get the needed values
    /** @type {number} */
    let name = args[0];
    /** @type {"on"|"off"} */
    let status = args[1].toLowerCase();
    let timeInfo = new Date(args[2] || Date.now());
    let time = timeInfo.getHours() + (timeInfo.getMinutes() / 60);

    // If the current name doesn't exist yet, add it without any values
    if (!data[name])
        data[name] = {
            daily: {},
            weekly: {},
            monthly: {}
        };
    console.log(`${name} Original:`);
    console.log(util.inspect(data[name], false, 3, true));
    // If the entered status is the same as the name's current status, don't do anything
    if (data[name].status === status)
        return console.log("Not updated due to unchanged status");
    // Update the status
    data[name].status = status;
    
    // Update the daily times
    if (!data[name].daily[status])
        // If the desired status doesn't have any values yet, set them
        data[name].daily[status] = {
            time, count: 1
        };
    else
    {
        let updated = getNewTime(time, data[name].daily[status]);
        data[name].daily[status] = updated;
    }

    // Make sure the day of the week exists
    if (!data[name].weekly[timeInfo.getDay()])
        data[name].weekly[timeInfo.getDay()] = {};
    // Update the weekly times
    if (!(data[name].weekly[timeInfo.getDay()] || {})[status])
        data[name].weekly[timeInfo.getDay()][status] = {
            time, count: 1
        };
    else
    {
        let updated = getNewTime(time, data[name].weekly[timeInfo.getDay()][status]);
        data[name].weekly[timeInfo.getDay()][status] = updated;
    }

    // Make sure the day of the month exists
    if (!data[name].monthly[timeInfo.getDate()])
        data[name].monthly[timeInfo.getDate()] = {};
    // Update the monthly times
    if (!(data[name].monthly[timeInfo.getDate()] || {})[status])
        data[name].monthly[timeInfo.getDate()][status] = {
            time, count: 1
        };
    else
    {
        let updated = getNewTime(time, data[name].monthly[timeInfo.getDate()][status]);
        data[name].monthly[timeInfo.getDate()][status] = updated;
    }

    // Write the values back into the file
    console.log("Updated:");
    console.log(util.inspect(data[name], false, 4, true));
    fs.writeFile('data.json', JSON.stringify(data),
        err => { if (err) console.log(err); }
    );
}

/**
 * @param {number} time 
 * @param {{
 *  time: number,
 *  count: number,
 *  stdev?: number
 * }} obj
 */
function getNewTime(time, obj) {
    // Decide which time mod to use.
    // If negative time is closer than given time, use that.
    // If a time is closer in the negative direction, it won't be closer upwards
    if (Math.abs(obj.time - (time - 24)) < Math.abs(obj.time - time))
        time -= 24;
    else if (Math.abs(obj.time - (time + 24)) < Math.abs(obj.time - time))
        time += 24;
    let newtime = ((obj.time * obj.count) + time) / (obj.count + 1);
    let avetime = (newtime + obj.time) / 2;
    let addtime = (time - avetime) * (time - avetime);
    let varianceSum = (obj.stdev || 0) * (obj.stdev || 0) * (obj.count - 1);
    
    return {
        time: (newtime % 24 + 24) % 24,
        count: obj.count + 1,
        stdev: Math.sqrt((varianceSum + addtime) / obj.count)
    };
}

module.exports = set;