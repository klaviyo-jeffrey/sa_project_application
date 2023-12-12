const fetch = require('node-fetch');

const API_KEY = process.env.PRIV_API_KEY || require('./config').PRIV_API_KEY;

let campaignIds = [];
const orderMetricId = 'Y3c8te'

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
    for (let i = 0; i < campaignIds.length; i++) {
      let ajaxUrl = `https://www.klaviyo.com/ajax/campaign/${campaignIds[i]}/reports/conversions?dimension=Name&statistic=${orderMetricId}`
      // let ajaxUrl = `https://www.klaviyo.com/ajax/campaign/01HGEZVYDWJV92R4XR307YGGQ1/reports/conversions?dimension=Name&statistic=Y3c8te`
      const ajaxHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'X-Csrftoken': 'Gklf8Ob2dYVtWSPYttP9S7Rti5rkTmKBfA7hZNyK0tP525dIKOBAsIbs6XMfXvXS',
        'Cookie': '__kla_id=eyJjaWQiOiJPRFV5T1Rka016SXROR1JpTkMwMFltUmtMVGcxT0RBdE1ETm1OR0ZoWTJRNU5UVXciLCIkZmlyc3RfbmFtZSI6IkplZmZyZXkiLCIkbGFzdF9uYW1lIjoiVmF6IElJIiwiSXNTdGFmZiI6dHJ1ZSwiQWNjb3VudElEIjoiOUJYM3doIiwiY3VycmVudF9jb21wYW55X2lkIjoiOUJYM3doIiwiJGV4Y2hhbmdlX2lkIjoiTWM2bDdMREFWMDZmOTVTeVpjRUxIR3R4TDZLeU1XQ0h0anlZb3VGbWdVST0uOUJYM3doIiwiJHJlZmVycmVyIjp7InRzIjoxNjg0NTM4NDI5LCJ2YWx1ZSI6Imh0dHBzOi8vd3d3LmtsYXZpeW8uY29tL3N0YWZmL2FjY291bnQvTkpEVFdzL2ludGVncmF0aW9ucyIsImZpcnN0X3BhZ2UiOiJodHRwczovL3d3dy5rbGF2aXlvLmNvbS9zdGFmZi9hY2NvdW50L05KRFRXcy9pbnRlZ3JhdGlvbi8xNDkxNjM5In0sIiRsYXN0X3JlZmVycmVyIjp7InRzIjoxNzAxOTk2Nzc3LCJ2YWx1ZSI6IiIsImZpcnN0X3BhZ2UiOiJodHRwczovL3d3dy5rbGF2aXlvLmNvbS9wcm9maWxlLzAxSEgzRTk5NVc2MkU0OFo2RFlBQlBWQlIxIn19; __kla_off=1; _uetsid=ac9c0aa0986e11ee9af9a3a3a7f317eb; _uetvid=29c96820e9dd11edb2b11b1bf62450ea; _gat=1; kl_csrftoken=Gklf8Ob2dYVtWSPYttP9S7Rti5rkTmKBfA7hZNyK0tP525dIKOBAsIbs6XMfXvXS; kl_sessionid=c16epwve28827c3czll2j41h3sxq3ld4;'
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
          // console.log(data);
          let sortedData = data.sort((a, b) => b.uniques - a.uniques);
          console.log(sortedData);
        })
        .catch(error => {
          console.error('Error:', error);
        });
    };
    
  })

  .catch(error => {
    console.error('Error:', error);
  });




