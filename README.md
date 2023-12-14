The script in this project allows for customers better understand which products contributed to the most conversions for their email Campaigns and export that data to an external CSV file for analyzation elsewhere.

There are both API endpoints and custom scripts that allow customers enhanced visibility into conversions:
- Query Metrics Aggregates API endpoint gives customers aggregate data on conversions, but does not include specific information on items that were purchased by their customers for each Campaign
- The SA team has also built a helpful guide that shows customers how to extract metric/event data into a Google Sheet: https://klaviyo.atlassian.net/wiki/spaces/SA/pages/3617357825/Extract+Metric+Event+Data+From+Klaviyo+to+a+CSV+Google+Sheet. This tool gives Klaviyo customers a better understanding of which profiles bought which products as a result of receiving a Campaign. But if the Klaviyo customer wanted to understand aggregate data on which products were the most popular purchases, they would need to aggregate the data in Google Sheets, and would need to account for a single customer buying multiple of the same product (non-unique purchases).

Lastly, each Campaign has a "conversions" tab (ex. https://www.klaviyo.com/campaign/01HGEZVYDWJV92R4XR307YGGQ1/reports/conversions) that can show the names of the products purchases, the unique and total count for purchasers, and total revenue generated from each product. However, this report only exists in the Klaviyo app UI, and cannot be exported.

The script in this project allows customers to view the above conversion data for each Campaign, and allows them to export it to a CSV file. The advantages here are
- Klaviyo customers no longer need to navigate to each Campaign and adjust the conversion settings. This would be especially tedious if they had many Campaigns
- Klaviyo customers no longer need to rely on the UI to analyze this data. By having it in a CSV file, they can analyze the data elsewhere. This script also provides the grounds to sending this conversion data to external sources if the customer does not want it in a CSV.

Klaviyo account used for testing: SA Shopify Demo (https://www.klaviyo.com/staff/account/Pe5Xw6/overview)