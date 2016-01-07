# Description
#   Allows Hubot to geocode using Mapzen Search / Pelias
#
# Dependencies:
#   request
#
# Configuration:
#   api_key
#
# Commands:
#   search <parameters> - calls Mapzen/v1/search (e.g. text=Union Square)
#
# Authors:
#   @orangejulius
#   @dianashk

'use strict';

var request = require('request');

var api_key = process.env.SEARCH_API_KEY;


module.exports = function (robot) {

  robot.respond(new RegExp('search'), function (res) {

    if (!isValidRequest(res)) {
      res.respond('Oops, you didn\'t provide us text');
      return;
    }

    var indexofSearch = res.message.text.indexOf('search');
    var query = res.message.text.substring(indexofSearch + 'search'.length + 1);

    sendRequest('search', api_key, query, function (err, url, places) {
      var response = makeResponse(url, places);
      console.log(response);
      response.channel = res.message.room;
      // messages with attachments have to be sent via robot.emit
      // see https://github.com/slackhq/hubot-slack/issues/108
      robot.emit('slack-attachment', response);
    });

  });
};

//app.get('/autocomplete', function(req, res) {
//
//  if (!isValidRequest(req, res)) {
//    return;
//  }
//
//  sendRequest('autocomplete', api_key, req.query.text, function (err, url, places) {
//    var response = makeResponse(url, places);
//    res.send(response);
//  });
//
//});


function isValidRequest(res) {
  return res.message.hasOwnProperty('text');
}

function sendRequest(endpoint, api_key, params, callback) {
  var url = 'https://search.mapzen.com/v1/' + endpoint + '?api_key=' + api_key + '&' + params;
  console.log('url', url);
  request.get(url, function (err, results) {
    if (err) {
      console.log(err);
      callback(err);
      return;
    }
    var places = JSON.parse(results.body);
    callback(null, url, places);
  });
}

function makeResponse(url, places) {
  var message = makeSearchLink(url);
  message += makeMapLink(places);
  message += makeResultList(places);

  return {
    "text": message,
    "attachments": [
      {
        "text": JSON.stringify(places, null, 2),
        "color": "#F78181"
      }
    ]
  };
}

function makeSearchLink(url) {
  return '<' + url + '| Click to see original query>\n';
}

function makeMapLink(places) {
  return '<' + 'http://geojson.io/#data=data:application/json,' +
    encodeURIComponent(JSON.stringify(places)) + '| Click to see on a map>\n';
}

function makeResultList(places) {
  var message = '';
  var count = 0;

  if (!places || !places.features || places.features.length === 0) {
    return 'No results found';
  }

  places.features.forEach(function (feature) {
    count++;
    message += count + '.  _' + feature.properties.label + '_\n';
  });

  return message;
}
