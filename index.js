
var request = require('request');

function WP_Node() {
  this.TTL = 1;
}

WP_Node.prototype.cache = function(options, fn) {
  var self = this;
	self.TTL = options.TTL || self.TTL;

	var url = options.url
		, db = options.db;

		//Go Straight to mongo
		db.collection('cache', function(err, collection) {
			collection.findOne({_id: url}, function(err, item) {

				if (!item) {
					console.log('Getting fresh content for ' + url);
					self.processRequest({
						request:{
								url: url
							},
						db: db,
						callback: fn
					});
					
				} else {

					//Check if we are over the cache limit
					var currentTime = +new Date();

          if ( ((currentTime - item.wp_timestamp)/1000) > self.TTL) {
						
						console.log('Removing and getting fresh content for ' + url);

						db.collection('cache', function(err, collection) {
        			collection.remove({_id:url}, {safe:true}, function(err, result) {
        				if (err)
        					console.log(err);
        					console.log(result);

								self.processRequest({
									request:{
											url: url
										},
										db: db,
										callback: fn
								});
							})
        		});

					} else {
						console.log('Getting cache for ' + url);
						fn(item.content);
					}

				}
			});
		});
}

WP_Node.prototype.processRequest = function(obj) {
	// request start
		request.get(obj.request, function(e, r, b){

			b = JSON.parse(b);

			var cache_object = {
				_id: obj.request.url, 
				content: b,
				wp_timestamp: +new Date()
			}

			obj.db.collection('cache', function(err, collection) {
        collection.insert(cache_object, {safe:true}, function(err, result) {
            if (err) {
            	console.log(err);
            	if (err.code == 11000)
            		obj.callback({error: err.code});
            } else {
                console.log('Success: ' + JSON.stringify(result));
                obj.callback(result[0].content);
            }
    		});
  		});
		}); //request end
}
var wpnode = new WP_Node();

module.exports = wpnode;