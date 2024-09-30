require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Connet to mongodb
const {MongoClient} = require('mongodb');
const dns = require('dns')
//const urlparser = require('url')
const { URL } = require('url');
const client = new MongoClient(process.env.DB_URL);
const db = client.db('urlshortner');
const urls = db.collection('urls')

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;

  dns.lookup(new URL(url).hostname, async (err, address) => {
    if (err || !address) {
      return res.json({ error: 'Invalid URL' });
    }

    try {
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url: urlCount
      };

      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({ original_url: url, short_url: urlCount });
    } catch (error) {
      console.error('Error creating short URL:', error);
      res.status(500).json({ error: 'Server Error' });
    }
  });
});


// Redirect to original URL using short URL
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +shortUrl });

  if (urlDoc) {
    res.redirect(urlDoc.url);
  } else {
    res.status(404).json({ error: 'Short URL not found' });
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
