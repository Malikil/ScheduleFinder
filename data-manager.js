const fs = require('fs');
const { inspect } = require('util');

// Make sure the data file exists
const FILENAME = 'new-data.json';
if (!fs.existsSync(FILENAME))
    fs.writeFileSync(FILENAME, '{}');
/**
 * @type {{
 *  firstUpdate: Date,
 *  lastUpdate: Date,
 *  status: "on"|"off",
 *  daily: number[][],
 *  weekly: number[][][],
 *  monthly: number[][][]
 * }[]}
 */
const data = (() => {
    const raw = JSON.parse(fs.readFileSync(FILENAME));
    let result = {
        ...raw
    };
    // Run through each field, if the value doesn't exist simply delete it
    Object.keys(raw).forEach(name => {
        // Make sure the dates are actually Date objects
        result[name].lastUpdate = new Date(raw[name].lastUpdate);
        result[name].firstUpdate = new Date(raw[name].firstUpdate);
        // Delete missing daily fields
        raw[name].daily.forEach((hour, ihour) => {
            if (!hour) delete result[name].daily[ihour];
            else hour.forEach((minute, iminute) => {
                if (minute == null) delete result[name].daily[ihour][iminute];
            });
        });
        // Delete missing weekly and monthly fields
        raw[name].weekly.forEach((day, iday) => {
            if (!day) delete result[name].weekly[iday];
            else day.forEach((hour, ihour) => {
                if (!hour) delete result[name].weekly[iday][ihour];
                else hour.forEach((minute, iminute) => {
                    if (minute == null) delete result[name].weekly[iday][ihour][iminute];
                });
            });
        });
        raw[name].monthly.forEach((day, iday) => {
            if (!day) delete result[name].monthly[iday];
            else day.forEach((hour, ihour) => {
                if (!hour) delete result[name].monthly[iday][ihour];
                else hour.forEach((minute, iminute) => {
                    if (minute == null) delete result[name].monthly[iday][ihour][iminute];
                });
            });
        });
    });

    return result;
})();

/**
 * @param {number} name 
 * @param {"on"|"off"} status 
 */
function addStatus(name, status) {
    let now = new Date();
    if (!data[name])
    {
        // If we don't know about this name yet, add them in
        data[name] = {
            firstUpdate: now,
            lastUpdate: now,
            status,
            daily: [],
            weekly: [],
            monthly: []
        };
        // Now add status for the current time
        let s = (status === 'on') | 0;

        data[name].daily[now.getHours()] = [];
        data[name].daily[now.getHours()][now.getMinutes()] = s;

        data[name].weekly[now.getDay()] = [];
        data[name].weekly[now.getDay()][now.getHours()] = [];
        data[name].weekly[now.getDay()][now.getHours()][now.getMinutes()] = s;

        // getDate is indexed from 1
        data[name].monthly[now.getDate() - 1] = [];
        data[name].monthly[now.getDate() - 1][now.getHours()] = [];
        data[name].monthly[now.getDate() - 1][now.getHours()][now.getMinutes()] = s;
    }
    else
    {
        // The name exists, so we need to average line segments back to the last update.
        // We'll only care about timing points that already have a value, either the
        // new value or a previous one

        // A general order for key operations:
        // - Get existing timing points between now and the last update
        // - Create a function (or similar) to calculate the 'partial status' of the new
        //      segment
        // - Add the partial status of the new segment to the average for each
        //      pre-existing timing point
        // - If the endpoints of the new segment fall in between existing timing points,
        //      new timing points should be added based on a segment between the timing
        //      points on either side of the endpoint

        // How many values are contributing to the previous average can be determined
        // based on the first update, because we have knowledge of how often each time
        // period loops

        // Rise is current status - last status
        // Run is current time - last time
        // Use the difference from lastUpdate for x so initial behaves correct
        // Initial is last status
        /** @param {Date} time */
        let partialStatus = time => (
          (((status === 'on') | 0) - ((data[name].status === 'on') | 0)) /
          (now - data[name].lastUpdate) * (time - data[name].lastUpdate) +
          ((data[name].status === 'on') | 0)
        );

        // Get the pre-existing timing points since last update
        // What if it's been more than a single rotation?
        
        // Run through each minute since the last update
        for (let current = new Date(data[name].lastUpdate);
                current < now;
                current.setMinutes(current.getMinutes() + 1))
        {
            let newValue = partialStatus(current);
            // Update daily
            if (data[name].daily[current.getHours()] &&
                    !isNaN(data[name].daily[current.getHours()][current.getMinutes()]))
            {
                let lastValue = data[name].daily[current.getHours()][current.getMinutes()];
                let oldRotations = Math.floor(
                    (data[name].lastUpdate - data[name].firstUpdate) / (1000 * 60 * 60 * 24)
                );
                // Update the average
                data[name].daily[current.getHours()][current.getMinutes()] = (
                    (lastValue * oldRotations + newValue) / (oldRotations + 1)
                );
            }

            // Update weekly
            if (data[name].weekly[current.getDay()] &&
                    data[name].weekly[current.getDay()][current.getHours()] &&
                    !isNaN(data[name].weekly[current.getDay()][current.getHours()][current.getMinutes()]))
            {
                let lastValue = data[name].weekly[current.getDay()][current.getHours()][current.getMinutes()];
                let oldRotations = Math.floor(
                    (data[name].lastUpdate - data[name].firstUpdate) / (1000 * 60 * 60 * 24 * 7)
                );
                data[name].weekly[current.getDay()][current.getHours()][current.getMinutes()] = (
                    (lastValue * oldRotations + newValue) / (oldRotations + 1)
                );
            }

            // Update monthly
            if (data[name].monthly[current.getDate() - 1] &&
                    data[name].monthly[current.getDate() - 1][current.getHours()] &&
                    !isNaN(data[name].monthly[current.getDate() - 1][current.getHours()][current.getMinutes()]))
            {
                let lastValue = data[name].monthly[current.getDate() -1][current.getHours()][current.getMinutes()];
                let oldRotations = Math.floor(
                    (data[name].lastUpdate - data[name].firstUpdate) / (1000 * 60 * 60 * 24 * 7)
                );
                data[name].monthly[current.getDate() - 1][current.getHours()][current.getMinutes()] = (
                    (lastValue * oldRotations + newValue) / (oldRotations + 1)
                );
            }
        }

        // Now if the new endpoint for the doesn't have a value yet, create one for it
        // The beginning of the new segment will have a value, this process
        // would have been done last time to take care of that
        // However the average with the newest time doesn't need to be found, rather than
        // skip the first loop or increment by a minute in the initializer above, I'll just
        // take care of the latest average there
        if (!data[name].daily[now.getHours()])
            data[name].daily[now.getHours()] = [];
        if (isNaN(data[name].daily[now.getHours()][now.getMinutes()]))
        {
            // Draw a line segment between the previous and next existing times
            // First find when they are
            let pre = new Date(now);
            while (!data[name].daily[pre.getHours()] ||
                    isNaN(data[name].daily[pre.getHours()][pre.getMinutes()]))
                pre.setMinutes(pre.getMinutes() - 1);
            let preVal = data[name].daily[pre.getHours()][pre.getMinutes()];
            let post = new Date(now);
            while (!data[name].daily[post.getHours()] ||
                    isNaN(data[name].daily[post.getHours()][post.getMinutes()]))
                post.setMinutes(post.getMinutes() + 1);
            let postVal = data[name].daily[post.getHours()][post.getMinutes()];
            // Find the expected value for the time
            // Rise is post value - pre value
            // Run is post time - pre time
            // Position is now - pre time
            // Initial is pre value
            data[name].daily[now.getHours()][now.getMinutes()] = (
                (postVal - preVal) / (post - pre) * (now - pre) + preVal
            );
        }
        // Verify weekly
        if (!data[name].weekly[now.getDay()])
            data[name].weekly[now.getDay()] = [];
        if (!data[name].weekly[now.getDay()][now.getHours()])
            data[name].weekly[now.getDay()][now.getHours()] = [];
        if (isNaN(data[name].weekly[now.getDay()][now.getHours()][now.getMinutes()]))
        {
            let pre = new Date(now);
            while (!data[name].weekly[pre.getDay()] ||
                    !data[name].weekly[pre.getDay()][pre.getHours()] ||
                    isNaN(data[name].weekly[pre.getDay()][pre.getHours()][pre.getMinutes()]))
                pre.setMinutes(pre.getMinutes() - 1);
            let preVal = data[name].weekly[pre.getDay()][pre.getHours()][pre.getMinutes()];
            let post = new Date(now);
            while (!data[name].weekly[post.getDay()] ||
                    !data[name].weekly[post.getDay()][post.getHours()] ||
                    isNaN(data[name].weekly[post.getDay()][post.getHours()][post.getMinutes()]))
                post.setMinutes(post.getMinutes() + 1);
            let postVal = data[name].weekly[post.getDay()][post.getHours()][post.getMinutes()];
            // Add expected value
            data[name].weekly[now.getDay()][now.getHours()][now.getMinutes()] = (
                (postVal - preVal) / (post - pre) * (now - pre) + preVal
            );
        }
        // Verify monthly
        if (!data[name].monthly[now.getDate() - 1])
            data[name].monthly[now.getDate() - 1] = [];
        if (!data[name].monthly[now.getDate() - 1][now.getHours()])
            data[name].monthly[now.getDate() - 1][now.getHours()] = [];
        if (isNaN(data[name].monthly[now.getDate() - 1][now.getHours()][now.getMinutes()]))
        {
            let pre = new Date(now);
            while (!data[name].monthly[pre.getDate() - 1] ||
                    !data[name].monthly[pre.getDate() - 1][pre.getHours()] ||
                    isNaN(data[name].monthly[pre.getDate() - 1][pre.getHours()][pre.getMinutes()]))
                pre.setMinutes(pre.getMinutes() - 1);
            let preVal = data[name].monthly[pre.getDate() - 1][pre.getHours()][pre.getMinutes()];
            let post = new Date(now);
            while (!data[name].monthly[post.getDate() - 1] ||
                    !data[name].monthly[post.getDate() - 1][post.getHours()] ||
                    isNaN(data[name].monthly[post.getDate() - 1][post.getHours()][post.getMinutes()]))
                post.setMinutes(post.getMinutes() + 1);
            let postVal = data[name].monthly[post.getDate() - 1][post.getHours()][post.getMinutes()];
            // Add expected value
            data[name].monthly[now.getDate() - 1][now.getHours()][now.getMinutes()] = (
                (postVal - preVal) / (post - pre) * (now - pre) + preVal
            );
        }
        // Update the latest status and updated time
        data[name].status = status;
        data[name].lastUpdate = now;
    }
}

function commit() {
    fs.writeFile(FILENAME, JSON.stringify(data),
        err => { if (err) console.log(err); }
    );
}

addStatus('example', 'on');
commit();
console.log(inspect(data, false, 4, true));