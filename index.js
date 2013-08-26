
var request = require('request')
	, ourUrls = [];

function wpnode(options, fn) {

	var url = options.url
		, db = options.db;

	if (ourUrls.length === 0) {

		request.get({
			url: url
		}, function(e, r, b){
			
			b = JSON.parse(b);

			db.collection('cache', function(err, collection) {
		        collection.insert(b, {safe:true}, function(err, result) {
		            if (err) {
		            	return err;
		            } else {
		                console.log('Success: ' + JSON.stringify(result));
		                fn(result);
		            }
		    	});
	    	});
			
		});
		
	}
	// for (var x = 0; x < ourUrls.length; x++) {
	// 	if (ourUrls[x] == url) {
	// 		console.log('it is in cache');
	// 		break;
	// 	}	
	// }

}

module.exports = wpnode;