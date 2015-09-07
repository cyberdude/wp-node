'use strict';

module.exports = function(core) {

  var wordpressCache = {};

  wordpressCache.clearCache = function(req, res, next) {
    var secret = req.body.secret;

    if (!secret) {
      return next('Missing secret');
    }

    if (secret !== core.secret) {
      return next('Wrong Key');
    }
    
    var post_id = parseInt(req.params.post_id);

    console.log('Removing cache for post_id ' + post_id + '. WordPress Request');

    core.db.collection('cache' , function(err, collection){
      collection.remove({'content.id': post_id}, {safe:true}, function(err, result) {

        if (err) {
          core.log(err);
        }

        //Let's remove all the category list cache
        collection.remove({$where : "this.content.length > 1"}, {safe:true}, function(err, result){

          if (err) {
            core.log(err);
          }
          //Let's send an ok for now
          res.json({status: 'ok'});
        });


      });
    })

  }

  return wordpressCache;
}