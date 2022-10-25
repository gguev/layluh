const express = require('express');
const app = express();
var compression = require('compression');
app.use(compression());

/* APP VARIABLES */
const G_API_KEY = // replace with your Google credentials

const T_CLIENT_ID = // replace with your Twitch credentials
const T_CLIENT_SECRET = // replace with your Twitch credentials

const V_API_KEY = // replace with your Vimeo credentials
const V_CLIENT_SECRET = // replace with your Vimeo credentials
const V_ACCESS_TOKEN = // replace with your Vimeo credentials

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
    'Authorization': // replace with your Twitch credentials,
    'Client-ID': T_CLIENT_ID
  }
});

const bitchute = axios.create({
  baseURL: 'https://bitchute.com/video/',
});

const { YTSearcher } = require('ytsearcher');
const ytsearcher = require('ytsearcher');
const searcher = new YTSearcher(G_API_KEY);

const youtube = require('scrape-youtube').default;

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

  const term = req.query.term
  if (term.includes(".com") || term.includes(".tv") || term.includes('.be')) {
    let fullURL = term;

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
    else if (fullURL.includes('youtu.be') || fullURL.includes('Youtu.be')) {
      splitURL = fullURL.split('be/');
      vidURL = splitURL[1];
      res.redirect(baseURL + '/watch?v=' + vidURL);
    
    } else {
      res.render("badLink");
    }  
  } else {
    let query = term;
    let cleanedQuery = query.replace(/\s/g, '+')
    res.redirect('/results?search=' + cleanedQuery)
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
// Results: fetch results
app.get("/results", function(req, res) {
  // scrape-youtube: ok, not great
  // usetube: havent tested, might use later for getting vids from channels
  
    (async () => {
      let query = req.query.search;
      let videos = [];
      
      try {
        const searchResults = await searcher.search(query, {type: 'video'});
        let page1 = [...searchResults.currentPage];
        console.log(page1)
        const searchResults2 = await searchResults.nextPage();
        let page2 = [...searchResults2.currentPage];
        
        const searchResults3 = await searchResults2.nextPage();
        let page3 = [...searchResults3.currentPage];

        videos = [...page1, ...page2, ...page3]

        res.render('apiResults', { query: query, videos: videos })  
      } catch (error) {
        if (error.toString().includes("null")) {
          res.render("resultsError", { query: query })
        } else if (error.toString().includes("403")) {
          res.render('quotaError')
        } else {
          res.render('genericError')
        }
        
      }
      
    })();

//     let query = req.query.search;

//     youtube.search(query, { type: 'any' })
//     .then(results => {
//       let streams = results.streams
//       let videos = results.videos

//       if (streams.length == 0 && videos.length == 0) {
//         res.render('resultsError.ejs', { query: query })
//       } else {
//         res.render('scrapeResults', { query: query, streams: streams, videos: videos });
//       }
//     })
//     .catch(error => {
//       console.log(error)
//       if (error.toString().includes("403")) {
//         res.render('quotaError')
//       } else {
//         res.render('genericError');
//       }
//      });     
//   })
  

// // Watch: takes to YT video
// app.get("/watch", function(req, res) {
//     var videoID = req.query.v;

//     gapi.videos.list({
//       auth: G_API_KEY,
//       part: "snippet",
//       id: videoID
//     }).then(function(response) {
//       var video = response.data.items;
      
//       if (video[0].snippet == undefined) {
//         res.render("badLink")
//       } else {
//         res.render("youtube", {video: video, videoID: videoID});  
//       }
//       }).catch(function (error) {
//         if (error.toString().includes("null")) {
//           res.render("resultsError", { query: query })
//         } else if (error.toString().includes("403")) {
//           res.render('quotaError')
//         } else {
//           res.render('genericError')
//         }
//       })
// })

// /*
//  *
//  * VIMEO
//  * 
// */
// // Videos: takes to Vimeo video
// app.get("/:videoID([0-9]+$)", function(req, res) {
//   var videoID = req.params.videoID;
  
//   vimeoClient.request({
//     path: '/videos/' + videoID, 
//   }, function (error, body, statusCode, headers) {
//     if (error) {
//       res.render("badLink");
//     } else {
//       var videoTitle = body.name;
//       res.render("vimeo", {videoID: videoID, videoTitle});
//     }
//   });
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
  res.render("genericError");
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
