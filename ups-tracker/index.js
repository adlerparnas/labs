const notifier = require('node-notifier');
const request = require('request');

let lastPackageStatus = null;

function notifyChange(trackingNumber) {
    notifier.notify({
        title: `Changes on package (${trackingNumber}) status`,
        message: `${lastPackageStatus.activityScan} - ${lastPackageStatus.location}`,
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
        if (err === null && resp.statusCode === 200) {
            const lastStatus = body.trackDetails[0].shipmentProgressActivities.filter(pa => pa.date)[0];
    
            if(JSON.stringify(lastStatus) != JSON.stringify(lastPackageStatus)) {
                console.log(`- Change found at ${trackingNumber}`);
                lastPackageStatus = lastStatus;
                notifyChange(trackingNumber);
            }
        } else {
            console.error(err.error);
        }


        setTimeout(trackPackage, 15000, trackingNumber);
    });
}

const trackNumbers = process.argv.slice(2);

trackNumbers.forEach(trackPackage);