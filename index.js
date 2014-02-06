"use strict";

var request = require('request')
  , qs = require('qs')
  , _ = require('underscore');

function WP_Node() {
  
  //Defaults
  this.TTL = 86400;
  this.logger = false;
  this.endpoint = '';
  this.db = null;
  this.endpoint = '';
  this.url = '';

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
WP_Node.prototype.generateSiteMap = function(options, cb){

  var self      = this
    , options   = options           || {}
    , endpoint  = options.endpoint  || self.endpoint
    , pre_link  = options.pre_link  || ''
    , sitemap   = [];

  if (!endpoint 
        || typeof endpoint === 'undefined') {
    cb({
        code      : 120,
        message   : 'A WordPress endpoint is required to generate a WP Site Map' 
      }, null
    );
    return;
  }

  self.log('Generating WordPress sitemap from ' + endpoint);

  request({
    url : endpoint,
    qs  : {
      post_type : 'post'
    }
  }, function(e, r, posts){
    
    if (typeof posts === 'string')
      posts = JSON.parse(posts);

    _.each(posts, function(post){
      sitemap.push({
        url         : pre_link + '/' + post.slug,
        changefreq  : 'daily',
        priority    : 0.5
      });
    });

    cb(e, sitemap);
  })
  
}

WP_Node.prototype.cache = function(options, fn) {
  
  var self = this;
  var TTL = options.TTL || self.TTL;

  self.log('Cache TTL is ' + TTL);

  var url   = options.url || self.endpoint
    , db    = options.db  || self.db
    , _qs   = options.qs  || {}
    , _id   = '';

    if (!self._isEmptyObject(_qs)) {
      self.log('_qs defined');
      _id = qs.stringify(_qs);
    }      
    
    if (!url) {
      fn(
        null, {
          code      : 100,
          message   : "No URL endpoint provided."
        }
      );
      return;
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
            fn(item.content, null);
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
             
              obj.callback(
                null, {
                  code              : 110, 
                  message           : "MongoDB error",
                  extra_information : err.code
                }
              );
            } else {
                obj.callback(result[0].content, null);
            }
        });
      });
    }); //request end
}

module.exports = new WP_Node();