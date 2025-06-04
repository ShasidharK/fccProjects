require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const {MongoClient, ObjectId} = require('mongodb');
const dns = require('dns');
const url = require('node:url');

let dbClient;
dbClient = new MongoClient(process.env.MONGO_URI);
dbClient.connect();
const db = dbClient.db("url_service");
let storeUrls = db.collection('urls');;


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {

  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: req.body });
});

// Endpoint to add a new short URL
app.post('/api/shorturl', async function(req, res){

  const urlString = req.body.url;
  const myURL = new URL(urlString);
  dns.lookup(myURL.host , async (req , validAddress) => {
 
   if(!validAddress){
    res.json({error: "invalid url"})
   } else {
      const countUrls = await storeUrls.findOneAndUpdate({ _id: new ObjectId('683c5190ea942b46162e1c51') }, {$inc : { count : 1 }}, { upsert: true, returnDocument: 'after' });
    const urlStore = { 
      url_string : urlString,
      short_url: countUrls.count
    }
   const result = await storeUrls.insertOne(urlStore);
    res.json({
      original_url: urlString,
      short_url: countUrls.count
    });
   }
  })
 });

app.get("/api/shorturl/:short_url" , async (req ,res) => {
  try {    
    const shorturl = req.params.short_url;
    const urlStore = await storeUrls.findOne({short_url: parseInt(shorturl, 10)});
    res.redirect(urlStore.url_string); 
  } catch (error) {
    res.json({error: "Something is wrong on server side"})
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
