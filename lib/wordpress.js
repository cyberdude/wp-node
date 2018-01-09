'use strict';

module.exports = function(core) {

  var wordpressCache = {};

  var processCategories = function(categories, res){

    categories = (typeof categories !== 'string') ? categories.map(function(category){
      return category.toLowerCase();
    }) : [categories.toLowerCase()];

    core.db.collection('cache' , function(err, collection){
      collection.update(
        { 'content.wn_name' : { $in : categories } },
        { $set : { invalid : true } },
        { multi : true },
        function(err, result) {
          
          if (err){
            console.error(err);
          }

          core.log('Removed ' + result + ' entries. In cat');

          res.send();
      });
    });

    res.send();
  };

  wordpressCache.clearCache = function(req, res, next) {

    var secret = req.body.secret;
    
    if (!secret) {
      console.warn('No secret provided.')
      return next('Missing secret');
    }

    if (secret !== core.secret) {
      console.error('Invalid key.');
      return next('Wrong Key');
    }

    if (req.body.type && req.body.type === 'categories')
      return processCategories(req.body.categories, res);
    
    var post_id = parseInt(req.body.post_id);

    core.log('Removing cache for post_id ' + post_id + '. WordPress Request');

    core.db.collection('cache' , function(err, collection){
      collection.update({ 'content.id': post_id },{ $set : { invalid : true } }, {multi : true}, function(err, result) {

        if (err) {
          core.log(err);
        }
        
        core.log('Removed ' + result + ' entries.');

        res.send();
      });
    })

  }

  return wordpressCache;
}
