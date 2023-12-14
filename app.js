const fetch = require('node-fetch');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// https://www.npmjs.com/package/csv-writer
const fs = require('fs');
// https://www.w3schools.com/nodejs/nodejs_filesystem.asp

const API_KEY = process.env.PRIV_API_KEY || require('./config').PRIV_API_KEY;

//you'll need to update the Ordered Product Metric ID from your Klaviyo account
const orderMetricId = 'PUrgmq';
// you'll need to grab the kl_sessionid from the Network tab after logging into Klaviyo
const klSessionId = 'kl_sessionid=7bukjruzniio9c95rie4h1qo2dg3cz2d;'

// need to use this to check if a file is empty. If so, add the headers to csv
// https://www.geeksforgeeks.org/node-js-fs-readfilesync-method/
const isCsvFileEmpty = () => {
  const fileContent = fs.readFileSync('records.csv', 'utf-8');
  // https://stackoverflow.com/questions/49651979/how-to-check-if-fs-read-is-empty
  console.log('length of CSV file: ', fileContent.length);
  if (fileContent.length === 0) {
    return true;
  } else {
    return false;
  }
};

// Campaigns might have been created before our desired date, but still sent within
// the desired timeframe. Similarly, some campaigns could be created within our timeframe
// but scheduled to send after our desired timeframe
const isBetweenDates = (sendDate, startDate, endDate) => {
  if (sendDate === null) {
    return false;
  }
  const sent = new Date(sendDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (sent >= start && sent < end) {
    return true;
  } else {
    return false;
  }
};

// get EMAIL campaigns created between Jan 1 2023 and Dec 31 2023 (one year)
// so that we can push the Campaign IDs into an array and use the IDs in our ajax
// calls to get conversions
const getCampaigns = async () => {
  let campaignIds = [];
  let url = 'https://a.klaviyo.com/api/campaigns/?filter=and(equals(messages.channel,"email"),greater-or-equal(created_at,2022-12-01),less-or-equal(created_at,2023-12-31))&fields[campaign]=send_time,name';
  const headers = {
    'Authorization': `Klaviyo-API-Key ${API_KEY}`,
    'accept': 'application/json',
    'revision': '2023-10-15'
  };
  try {
    while (url !== null) {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      let data = await response.json();
      let campaignData = data.data

      // get the campaign IDs for the ajax call to get conversions
      for (let i = 0; i < campaignData.length; i++) {
        let campaignId = campaignData[i]['id'];
        let sendTime = campaignData[i]["attributes"]['send_time'];
        
        if (await isBetweenDates(sendTime, "2023-01-01T00:00:00+00:00", "2024-01-01T00:00:00+00:00")) {
          campaignIds.push(campaignId);
        } else {
          console.log(`Campaign ID ${campaignId} was not sent in the desired timeframe`);
        }
      }
      if (data.links.next) {
        console.log('next URL: ', data['links']['next']);
        url = data['links']['next'];
        // adding 1 second delay for rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        url = null;
        console.log('loop over');
      }

    }
    return campaignIds;

  } catch (error) {
    console.error('Error:', error);
  }

}  


getCampaigns()
  .then(campaignIds => {
    console.log('Final campaignIds array:', campaignIds);
    console.log(campaignIds.length);

    // loop through campaignIds array to make ajax call for conversions
    for (let i = 0; i < campaignIds.length; i++) {
      let ajaxUrl = `https://www.klaviyo.com/ajax/campaign/${campaignIds[i]}/reports/conversions?dimension=Name&statistic=${orderMetricId}`;
      const ajaxHeaders = {
        'Content-Type': 'application/json',
        'Cookie': klSessionId
      };
      fetch(ajaxUrl, {
        method: 'GET',
        headers: ajaxHeaders,
      })
        .then(response => {
          if (response.status === 200) {
            return response.json();
          } else {
            // If the response status is not 200, skip the iteration. 
            // we'll respond with a 400 error if a Campaign doesn't have attributions
            console.log(`No attributions for Campaign ID ${campaignIds[i]}. See response below`);
            throw new Error(`Request failed. Status: ${response.status}`);
          }
        })
        .then(data => {
          //sorting the data from most unique purchases to least for csv file cleanliness
          let sortedData = data.sort((a, b) => b.uniques - a.uniques);
          let currentCampaignId = campaignIds[i];
          console.log(`logging sorted data for ${currentCampaignId}`);
          console.log(sortedData);
          
          //write sorted conversion data to csv file
          const csvWriter = createCsvWriter({
            path: '/Users/jeffrey.vaz/scratch-projects/sa_project_application/records.csv',
            header: [
              { id: 'campaign', title: 'Campaign ID' },
              { id: 'name', title: 'Item Name' },
              { id: 'uniques', title: 'Unique Purchasers' },
              { id: 'value', title: 'Total Value' },
              { id: 'count', title: 'Total Count' },
            ],
            append: true
          });

          let records = [];
          for (let j = 0; j < sortedData.length; j++) {
            records.push({
              campaign: currentCampaignId,
              name: sortedData[j].name,
              uniques: sortedData[j].uniques,
              value: sortedData[j].value,
              count: sortedData[j].count,              
            });
          }
          console.log('logging records');
          console.log(records);

          //this will only execute if the CSV file is empty
          //it is adding headers to the front of the records array. If I do not
          //add this code, the headers get overwritten
          if (isCsvFileEmpty()) {
            records.unshift({ campaign: 'Campaign ID', name: 'Item Name', 
              uniques: 'Unique Purchasers', value: 'Total Value', count: 'Total Count' });
          }

          csvWriter.writeRecords(records)
          .then(() => console.log('CSV file writing complete'))
          .catch(error => console.error('CSV file writing error', error));

        })
        .catch(error => {
          console.error('Error:', error);
        });
      
    };
  })
  .catch(error => {
    console.error('Error:', error);
  });