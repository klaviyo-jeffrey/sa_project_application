const fetch = require('node-fetch');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// https://www.npmjs.com/package/csv-writer
const fs = require('fs');

const API_KEY = process.env.PRIV_API_KEY || require('./config').PRIV_API_KEY;

let campaignIds = [];
const orderMetricId = 'Y3c8te'

// get EMAIL campaigns created between Jan 1 2023 and Dec 31 2023 (one year)
// so that we can push the Campaign IDs into an array and use the IDs in our ajax
// call to get conversions
const url = 'https://a.klaviyo.com/api/campaigns/?filter=and(equals(messages.channel,"email"),greater-or-equal(created_at,2023-01-01),less-or-equal(created_at,2023-12-31))&fields[campaign]=send_time,name';
const headers = {
  'Authorization': `Klaviyo-API-Key ${API_KEY}`,
  'accept': 'application/json',
  'revision': '2023-10-15'
};

fetch(url, {
  method: 'GET',
  headers: headers
})
  .then(response => response.json())
  .then(data => {
    const responseData = data;
    const campaignData = responseData.data
    
    // get the campaign IDs for the ajax call to get conversions
    for (let i = 0; i < campaignData.length; i++) {
      let campaignId = campaignData[i]['id'];
      campaignIds.push(campaignId);
    };
    console.log(campaignIds);

    // loop through campaignIds array to make ajax call for conversions
    for (let i = 0; i < campaignIds.length; i++) {
      let ajaxUrl = `https://www.klaviyo.com/ajax/campaign/${campaignIds[i]}/reports/conversions?dimension=Name&statistic=${orderMetricId}`
      const ajaxHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'X-Csrftoken': 'Gklf8Ob2dYVtWSPYttP9S7Rti5rkTmKBfA7hZNyK0tP525dIKOBAsIbs6XMfXvXS',
        'Cookie': '__kla_id=eyJjaWQiOiJPRFV5T1Rka016SXROR1JpTkMwMFltUmtMVGcxT0RBdE1ETm1OR0ZoWTJRNU5UVXciLCIkZmlyc3RfbmFtZSI6IkplZmZyZXkiLCIkbGFzdF9uYW1lIjoiVmF6IElJIiwiSXNTdGFmZiI6dHJ1ZSwiQWNjb3VudElEIjoiOUJYM3doIiwiY3VycmVudF9jb21wYW55X2lkIjoiOUJYM3doIiwiJGV4Y2hhbmdlX2lkIjoiTWM2bDdMREFWMDZmOTVTeVpjRUxIR3R4TDZLeU1XQ0h0anlZb3VGbWdVST0uOUJYM3doIiwiJHJlZmVycmVyIjp7InRzIjoxNjg0NTM4NDI5LCJ2YWx1ZSI6Imh0dHBzOi8vd3d3LmtsYXZpeW8uY29tL3N0YWZmL2FjY291bnQvTkpEVFdzL2ludGVncmF0aW9ucyIsImZpcnN0X3BhZ2UiOiJodHRwczovL3d3dy5rbGF2aXlvLmNvbS9zdGFmZi9hY2NvdW50L05KRFRXcy9pbnRlZ3JhdGlvbi8xNDkxNjM5In0sIiRsYXN0X3JlZmVycmVyIjp7InRzIjoxNzAxOTk2Nzc3LCJ2YWx1ZSI6IiIsImZpcnN0X3BhZ2UiOiJodHRwczovL3d3dy5rbGF2aXlvLmNvbS9wcm9maWxlLzAxSEgzRTk5NVc2MkU0OFo2RFlBQlBWQlIxIn19; __kla_off=1; _uetsid=ac9c0aa0986e11ee9af9a3a3a7f317eb; _uetvid=29c96820e9dd11edb2b11b1bf62450ea; _gat=1; kl_csrftoken=rwHlPFpKwIMrFkae2Kmuf2MVZpUXoSPHgaVi8TlXBi4lna6kh1pEfDwx4XfuLTqS; kl_sessionid=mkgo6m0jrzdpnjf7q1ggpruu11gginwm;'
      }
      fetch(ajaxUrl, {
        method: 'GET',
        headers: ajaxHeaders,
      })
        .then(response => {
          if (response.status === 200) {
            return response.json();
          } else {
            // If the response status is not 200, skip the iteration
            console.log(`No attributions for Campaign ID ${campaignIds[i]}. See response below`);
            throw new Error(`Request failed with status ${response.status}`);
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




