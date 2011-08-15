#!/usr/local/bin/node

var sys = require('sys');
var util = require('util');
var crypto = require('crypto');
var http = require('http');
var oauth = require('oauth');


/**
 * Twitter Bot
 *
 * extends {}
 *
 * @param spec {}
 */
var twitbot = function(spec, my) {
    my = my || {};
    
    my.consumer_key = '';
    my.consumer_secret = '';
    
    my.access_token = '';
    my.access_secret = '';

    my.req = 'rpp=100&result_type=recent&q="coding"';
    my.user_agent = 'Mozilla/5.0 (X11; U; Linux x86_64; en-US) AppleWebKit/532.0 (KHTML, like Gecko) Chrome/4.0.202.0 Safari/532.0';
    
    my.since_id = 0;

    var refresh, post, main;

    var that = {};

    refresh = function() {    
	var path = '/search.json?' + my.req;    
	var options = { host: 'search.twitter.com',
			port: 80,
			method: 'GET',
			path: path,
			headers: { 'User-Agent': my.user_agent }
		      };
	
	var req = http.request(options, function(res) {
				   res.setEncoding('utf8');
				   var body = '';
				   res.on('data', function (chunk) {
					      body += chunk;
					  });
				   res.on('end', function () {
					      try {
						  var json = JSON.parse(body);
						  if(json.error) {
						      // ERROR: slow down
						      setTimeout(refresh, 4000); 
						      return;
						  }
						  console.log(my.since_id);
						  if(json.results && my.since_id > 0) {
						      for(var i = 0; i < json.results.length; i ++) {
							  var tweet = json.results[i];
							  if(tweet.id > my.since_id) {
							      // PROCESS tweet HERE
							      console.log('TWEET: ' + tweet.text);
							  }
						      }
						  }
						  if(json.max_id && json.max_id > my.since_id) {
						      my.since_id = json.max_id;
						      refresh();
						  }
						  else {
						      // NO RESULT: slow down
						      setTimeout(refresh, 1000); 
						  }						  
					      } catch (x) {						  
						  setTimeout(refresh, 4000); 
					      }

					  });
			       });
	req.on('error', function(e) {
		   console.log('SEARCH FAILED: ' + e);
	       });
	req.end();
    };
    
    my.oa = new oauth.OAuth("https://api.twitter.com/oauth/request_token",
 			    "https://api.twitter.com/oauth/access_token",
			    my.consumer_key,
			    my.consumer_secret,
			    "1.0",
			    null,
			    "HMAC-SHA1");
    
    post = function(status) {
	var body = { status: status };
	console.log('POST: ' + status);

	var req = my.oa.post("http://api.twitter.com/1/statuses/update.json", 
			     my.access_token, my.access_secret, 
			     body);
	
	req.on('reponse', function(res) {
		   console.log('STATUS: ' + res.statusCode);
		   console.log('HEADERS: ' + JSON.stringify(res.headers));
		   res.setEncoding('utf8');
		   res.on('data', function (chunk) {
			      console.log('BODY: ' + chunk);
			  });
	       });	
	req.end();
    };

    
    main = function() {
	refresh();
    };

    that.main = main;

    return that;
};

twitbot({}).main();
