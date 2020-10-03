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
 */
function current(args) {
    if (args.length < 1)
    {
        console.log("Sets the currently online names. Any names online in data " +
            "but not on the list will be set to offline, and vice versa");
        console.log('current <...names>');
        console.log("Names should be separated by spaces");
        return;
    }

    let seen = [];
    Object.keys(data).forEach(/** @param {number} key */key => {
        // Get the location in args for the name, if it's there
        let index = args.indexOf(key);
        // If the status is currently correct, skip out
        if (index < 0 && data[key].status === 'off')
            return;
        else if (index > -1 && data[key].status === 'on')
            return seen.push(key);
        
        console.log(`Updating status for ${key}`);
        
        // The status will be indicated by the name's inclusion on the list
        let status = index > -1 ? 'on' : 'off';
        updateTimes(key, status);

        // Indicate we've seen this name, so we don't add a new entry for it later
        seen.push(key);
    });
    
    // Add new names to the data
    args.filter(x => !seen.includes(x)).forEach(/** @param {number} name */name => {
        // If the name already exists, there's a problem
        if (data[name])
            throw "Bad news bears";
        
        console.log(`Adding new entry for ${name}`);
        
        data[name] = {
            daily: {},
            weekly: {},
            monthly: {}
        };

        updateTimes(name, 'on');
    });

    // Write the values back into the file
    fs.writeFile('data.json', JSON.stringify(data),
        err => { if (err) console.log(err); }
    );
}

function updateTimes(name, status) {
    const timeInfo = new Date(Date.now());
    const time = timeInfo.getHours() + (timeInfo.getMinutes() / 60);

    // Set status
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

module.exports = current;