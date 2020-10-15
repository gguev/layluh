const express = require('express');
const app = express();
var compression = require('compression');
app.use(compression());

/* APP VARIABLES */
const G_API_KEY = 'AIzaSyAOzl6ucfX2CX5F5v_hycLx3HJCw5lZifA';

const T_CLIENT_ID = 'pogovil2vx8j5a416wsxainjl47rbx';
const T_CLIENT_SECRET = '7xbojvtivgi3w4hpnf9t47y4796dm9';

const V_API_KEY = '2de0245d14ff8e7115c90072c81ea32452e3a2a2';
const V_CLIENT_SECRET = 'COIAqWTIywlmU1Rrl2jiwLlYeyf3DMvv24zTuX0/PbIQspi4+UXPmilZ+57htqLWHCqa2bpADSEWL/8/5JT+bgj044L9MRiGYAVSzM9tvU6gmzOKTTKNwzLO5rX1Anct';
const V_ACCESS_TOKEN = '55df03b15c52953a198c5c556fd09e9d';

var path = require('path');

var favicon = require('serve-favicon')
app.use(favicon(path.join(__dirname, 'public', 'images/favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

const axios = require('axios');
const cheerio = require('cheerio');

var Vimeo = require('vimeo').Vimeo;
var vimeoClient = new Vimeo(V_API_KEY, V_CLIENT_SECRET, V_ACCESS_TOKEN);

const {google} = require('googleapis');
var gapi = google.youtube('v3');

const idTwitch = axios.create({
  baseURL: 'https://id.twitch.tv/oauth2/token?client_id=' + T_CLIENT_ID + '&client_secret=' + T_CLIENT_SECRET + '&grant_type=client_credentials'
})

const helix = axios.create({
  baseURL: 'https://api.twitch.tv/helix/',
  headers: {
    'Authorization': 'Bearer hebaa6exndcec8g0o93hiyz8kk1ph9',
    'Client-ID': T_CLIENT_ID
  }
});

const bitchute = axios.create({
  baseURL: 'https://bitchute.com/video/',
});

const { YTSearcher } = require('ytsearcher');
const searcher = new YTSearcher(G_API_KEY);


const IP = process.env.IP || "127.0.0.1";
const PORT = process.env.PORT || 5500;

const baseURL = "http://127.0.0.1:5500";

app.set('view engine', 'ejs');

/*
 *
 * INDEX
 * 
*/
// Home 
app.get('/', function(req, res) {
    // //uncomment to get bearer tokens
    // idTwitch.post().then((response) => {
    //   console.log(response)
    // })

    res.render("home")
});

// Features page
app.get("/features", function(req, res) {
  res.render("features");
});

// Donation page
app.get("/donate", function(req, res) {
  res.render("donate");
});

// About page
app.get("/about", function(req, res) {
  res.render("about");
})

// Loading: Redirects to relevant path
app.get('/loading', function(req, res) {
  var fullURL = req.query.URL;
  
  if (fullURL.includes("youtube.com") || fullURL.includes("vimeo.com") || fullURL.includes("bitchute.com")) {
    splitURL = fullURL.split('com');
    vidURL = splitURL[1];

    res.redirect(baseURL + vidURL);   
  }
  else if (fullURL.includes('twitch.tv')) {
    splitURL = fullURL.split('tv');
    vidURL = splitURL[1];

    res.redirect(baseURL + vidURL);
  }
  // YOUTUBE EMBED SUPPORT
  else if (fullURL.includes('youtu.be')) {
    splitURL = fullURL.split('be/');
    vidURL = splitURL[1];
    res.redirect(baseURL + '/watch?v=' + vidURL);
  
  } else {
    res.render("badLink");
  }  

});

// Layluh prepend
app.get('/:URL(http*)', function(req, res) {
  var paramURL = req.params.URL;

  if (paramURL.includes("youtube.com")) {
    var queryURL = req.query.v;
    var watchURL = "/watch?v=" + queryURL;
    res.redirect(baseURL + watchURL);    
  }
  else if (paramURL.includes("vimeo.com") || paramURL.includes("bitchute.com")) {
    splitURL = paramURL.split('com');
    vidURL = splitURL[1];
    res.redirect(baseURL + vidURL); 
  }
  else if (paramURL.includes("twitch.tv")) {
    splitURL = paramURL.split('tv');
    vidURL = splitURL[1];

    res.redirect(baseURL + vidURL);
  }
  else {
    res.render("badLink");
  }
});

/*
 *
 * YOUTUBE
 * 
*/
// Watch : takes to YT video
app.get("/results", function(req, res) {

    (async () => {
      let query = req.query.search;
      let videos = [];
     
      const searchResults = await searcher.search(query, {type: 'video'});
      let page1 = [...searchResults.currentPage];
      console.log(page1)

      const searchResults2 = await searchResults.nextPage();
      let page2 = [...searchResults2.currentPage];
      console.log(page2)
      
      const searchResults3 = await searchResults2.nextPage();
      let page3 = [...searchResults3.currentPage];
      console.log(page3)

      videos = [...page1, ...page2, ...page3]

      res.render('results', { query: query, videos: videos })
    })();
    

    
  })
  


app.get("/watch", function(req, res) {
    var videoID = req.query.v;

    gapi.videos.list({
      auth: G_API_KEY,
      part: "snippet",
      id: videoID
    }).then(function(response) {
      var video = response.data.items;
      
      if (video[0].snippet == undefined) {
        res.render("badLink")
      } else {
        res.render("youtube", {video: video, videoID: videoID});  
      }
      }).catch(function () {
        res.render("badLink");
      })
})

/*
 *
 * VIMEO
 * 
*/
// Videos: takes to Vimeo video
app.get("/:videoID([0-9]+$)", function(req, res) {
  var videoID = req.params.videoID;
  
  vimeoClient.request({
    path: '/videos/' + videoID, 
  }, function (error, body, statusCode, headers) {
    if (error) {
      res.render("badLink");
    } else {
      var videoTitle = body.name;
      res.render("vimeo", {videoID: videoID, videoTitle});
    }
  });
});

/*
 *
 * TWITCH 
 * 
*/
// ChannelID: takes to Twitch livestream of channel
app.get("/:channel([a-zA-Z0-9]+[^/.]+[a-zA-Z0-9]$)", function(req, res) {
  var channel = req.params.channel;

  res.render("twitchChannel", {channel: channel});
});

// Video: takes to Twitch VOD/
app.get("/videos/:videoID", function(req, res) {
  var videoID = req.params.videoID;

  helix.get('videos?id=' + videoID)
    .then(function (response) {
      var vodTitle = response.data.data[0].title;

      res.render("twitchVOD", {vodTitle: vodTitle, videoID: videoID});
    }).catch(function () {
      res.render("badLink");
    });
});

/*
 *
 * BITCHUTE 
 * 
*/
// Video: takes to BitChute video
app.get("/video/:videoID/", function(req, res) {
  var videoID = req.params.videoID;

  bitchute.get(videoID)
  .then(function (response) {
    if (response.status == 200) {
      const html = response.data
      const $ = cheerio.load(html);
      var videoTitle = $('title').text();

      res.render("bitchute", {videoID: videoID, videoTitle: videoTitle});
    }
  }).catch(function () {
    res.render("badLink");
  });
  
});

/*
 *
 * 404 URL
 * 
*/
app.get('*', function(req, res){
  res.render("badLink");
});


/*
 *
 * LISTEN
 * 
*/
/* LISTEN */
app.listen(PORT, IP, function() {
  console.log("App listening on port " + PORT + " at IP " + IP);
});