var request = require('request');

function WP_Node() {
  //Defaults
  this.TTL = 5400;
  this.logger = false;

}
WP_Node.prototype.log = function(msg) {
  if (this.logger)
    console.log(msg);
}

WP_Node.prototype.setGlobalOptions = function(options) {
  for(var key in options)
    this[key] = options[key];
}

WP_Node.prototype.cache = function(options, fn) {
  var self = this;
  var TTL = options.TTL || self.TTL;

  self.log('Cache TTL is ' + TTL);

  var url = options.url
    , db = options.db
    , qs = options.qs || {};

    //Go Straight to mongo
    db.collection('cache', function(err, collection) {
      collection.findOne({_id: url}, function(err, item) {

        if (!item) {
          self.log('Getting fresh content for ' + url);
          self.processRequest({
            request:{
                url: url,
                qs: qs
              },
            db: db,
            callback: fn
          });
          
        } else {

          //Check if we are over the cache limit
          var currentTime = +new Date();

          if ( ((currentTime - item.wp_timestamp)/1000) > TTL) {
            
            self.log('Removing and getting fresh content for ' + url);

            db.collection('cache', function(err, collection) {
              collection.remove({_id:url}, {safe:true}, function(err, result) {
                
                if (err)
                  self.log(err);

                self.processRequest({
                  request:{
                      url: url,
                      qs: qs
                    },
                    db: db,
                    callback: fn
                });
              })
            });

          } else {
            self.log('Getting cache for ' + url);
            fn(item.content);
          }

        }
      });
    });
}

WP_Node.prototype.processRequest = function(obj) {
  // request start
  var self = this;
  
    request.get(obj.request, function(e, r, b){

      try {
        b = JSON.parse(b);
      } catch (ex) {
        
        self.log(ex);
        obj.callback({error: ex});

        return;
      }
      
      var cache_object = {
        _id: obj.request.url, 
        content: b,
        wp_timestamp: +new Date()
      }

      obj.db.collection('cache', function(err, collection) {
        collection.insert(cache_object, {safe:true}, function(err, result) {
            if (err) {
              self.log(err);
              if (err.code == 11000)
                obj.callback({error: err.code});
            } else {
                obj.callback(result[0].content);
            }
        });
      });
    }); //request end
}
var wpnode = new WP_Node();

module.exports = wpnode;