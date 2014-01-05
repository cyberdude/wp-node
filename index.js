var request = require('request')
  , qs = require('qs');

function WP_Node() {
  //Defaults
  this.TTL = 5400;
  this.logger = false;
  this.endpoint = '';

}

WP_Node.prototype._isEmptyObject = function(obj) {
  return !Object.keys(obj).length;
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
    , _qs = options.qs || {}
    , _id = '';

    if (!self._isEmptyObject(_qs)) {
      self.log('_qs defined');
      _id = qs.stringify(_qs);
    }      
    
    _id = url + ( (url.indexOf('?') > -1) ? _id : '?' + _id );

    self.log('Final ID to mongo is: ' + _id);

    //Go Straight to mongo
    db.collection('cache', function(err, collection) {
      collection.findOne({_id: _id}, function(err, item) {

        if (!item) {
          self.log('Getting fresh content for ' + _id);
          self.processRequest({
            request:{
                url: url,
                qs: _qs
              },
            _id: _id,
            db: db,
            callback: fn
          });
          
        } else {

          //Check if we are over the cache limit
          var currentTime = +new Date();

          if ( ((currentTime - item.wp_timestamp)/1000) > TTL) {
            
            self.log('Removing and getting fresh content for ' + _id);

            db.collection('cache', function(err, collection) {
              collection.remove({_id: _id}, {safe:true}, function(err, result) {
                
                if (err)
                  self.log(err);

                self.processRequest({
                  request:{
                      url: url,
                      qs: _qs
                    },
                    _id: _id,
                    db: db,
                    callback: fn
                });
              })
            });

          } else {
            self.log('Getting cache for ' + _id);
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
        _id: obj._id, 
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

module.exports = new WP_Node();