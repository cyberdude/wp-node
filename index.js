
var request = require('request')
	, ourUrls = [];

function wpnode(options, fn) {

	this.TTL = 30;

	var url = options.url
		, db = options.db;


		//Go Straight to mongo
		db.collection('cache', function(err, collection) {
			collection.findOne({id: url}, function(err, item) {
			
				if (!item) {
					console.log('Getting cache for' + url);
					// request start
					request.get({
						url: url
					}, function(e, r, b){

						b = JSON.parse(b);

						var cache_object = {
							id: url, 
							content: b,
							wp_timestamp: +new Date()
						}

						db.collection('cache', function(err, collection) {
			        collection.insert(cache_object, {safe:true}, function(err, result) {
			            if (err) {
			            	return err;
			            } else {
			                console.log('Success: ' + JSON.stringify(result));
			                fn(result[0].content);
			            }
			    		});
		    		});
					}); //request end
				} else {

					//Check if we are over the cache limit
					console.log(item.wp_timestamp);

					var currentTime = +new Date();

					if ( ((currentTime - item.wp_timestamp)/1000) > this.TTL) {
						console.log('Getting fresh content for ' + url);


					}



					fn(item.content);

				}
			});
		});
/*
		

			

			db.collection('cache', function(err, collection) {
		        collection.insert(cache_object, {safe:true}, function(err, result) {
		            if (err) {
		            	return err;
		            } else {
		                console.log('Success: ' + JSON.stringify(result));
		                fn(result[0].content);
		            }
		    	});
	    	});
			
		});
		
*/
}

wpnode.clearBot = function(url, db) {
	console.log('Clearing Cache');
	db.collection('cache', function(err, collection) {
        collection.findOne({id: url}, function(err, item) {
            if (err)
            	console.log(err);

            console.log('Removing cache for ' + url);


        });
    });
}
module.exports = wpnode;