const notifier = require('node-notifier');
const request = require('request');

let lastPackagesStatuses = {};

function notifyChange(trackingNumber, packageStatus) {
    notifier.notify({
        title: `Changes on package (${trackingNumber}) status`,
        message: `${packageStatus.activityScan} - ${packageStatus.location}`,
        open: `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}&requester=UPSHome/trackdetails`,
        wait: true,
        timeout: 30,
        sound: true
    },
    (err, response) => {
        console.log(response);
    });
}

function trackPackage(trackingNumber)
{
    console.log(new Date(),`Checking status of package ${trackingNumber}`);
    const UPSUrl = 'https://www.ups.com/track/api/Track/GetStatus?loc=en_US';

    request.post(UPSUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
        },
        json: {
            Locale:"en_US",
            TrackingNumber: [trackingNumber]
        }
    }, (err, resp, body) => {
        const lastPackageStatus = lastPackagesStatuses[trackingNumber];

        console.log(JSON.stringify(body, 0, 2));

        if (err === null && resp.statusCode === 200) {
            const trackDetails = body.trackDetails.shift();
            
            if (trackDetails && trackDetails.shipmentProgressActivities) {
                const lastStatus = trackDetails.shipmentProgressActivities.filter(
                    pa => pa.date
                ).shift();

                console.debug(lastStatus);
        
                if(lastStatus && JSON.stringify(lastStatus) != JSON.stringify(lastPackageStatus)) {
                    console.log(`- Change found at ${trackingNumber}`);
                    lastPackagesStatuses[trackingNumber] = lastStatus;
                    notifyChange(trackingNumber, lastStatus);
                } else {
                    console.debug(new Date(), "No last status found", trackDetails.shipmentProgressActivities);
                }
            } else {
                console.debug(new Date(), "No Tracking details found");
            }

        } else {
            console.error(err.error);
        }


        setTimeout(trackPackage, 15000, trackingNumber);
    });
}

const trackNumbers = process.argv.slice(2);

trackNumbers.forEach(trackPackage);