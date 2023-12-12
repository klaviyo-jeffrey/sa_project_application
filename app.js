const fetch = require('node-fetch');

const API_KEY = process.env.PRIV_API_KEY || require('./config').PRIV_API_KEY;

let campaignIds = [];

const url = 'https://a.klaviyo.com/api/campaigns/?filter=and(equals(messages.channel%2C%22email%22)%2Cgreater-or-equal(created_at%2C2023-01-01)%2Cless-or-equal(created_at%2C2023-12-31))&fields[campaign]=send_time%2Cname';
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
  })
  .catch(error => {
    console.error('Error:', error);
  });



