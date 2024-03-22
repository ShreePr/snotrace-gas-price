const axios = require('axios');
const cheerio = require('cheerio');
const schedule = require('node-schedule');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
var url = process.env.DB_URI;

// Define the CORS options
const corsOptions = {
  credentials: true,
  origin: ['http://localhost:3000', 'http://localhost:80'],
};

app.use(cors(corsOptions));

app.get('/gasDetails', async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Credentials', true);

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db('RNS');
    dbo
      .collection('gasDetails')
      .find({})
      .toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
        response.send(result);
        db.close();
      });
  });
});

async function scrapeAndStoreGasPrice() {
  try {
    const gasDeta = await axios.get(process.env.SNOWTRACE_URI);
    const $ = cheerio.load(gasDeta.data);
    const medGasPrice = $('#__NEXT_DATA__').text();
    const parseData = JSON.parse(medGasPrice);
    if (parseData?.props) {
      let gasPrices = parseData?.props?.pageProps?.dehydratedState?.queries
        ?.flatMap((item) =>
          item.state.data.items?.map((gas) => {
            if (gas?.gasPrice) {
              return {
                chainId: gas.chainId,
                price: gas.gasPrice,
                timestamp: gas.timestamp,
              };
            }
          })
        )
        .filter((gasPrice) => gasPrice !== undefined);

      MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db('RNS');
        dbo.collection('gasDetails').insertMany(gasPrices, function (err, res) {
          if (err) throw err;
          console.log('Number of documents inserted: ' + res.insertedCount);
          db.close();
        });
      });
    }
  } catch (error) {
    console.error('Error scraping gas price:', error);
  }
}

schedule.scheduleJob('*/30 * * * *', scrapeAndStoreGasPrice);

app.listen(PORT, (port) => {
  console.log('Server Listening on PORT:', PORT);
});
