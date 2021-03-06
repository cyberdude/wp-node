# wp-node

Caches WordPress in mongo using a JSON API.  It can also cache any json, as long as the request returns an json object.

You can use either WordPress Public API or another plugin like this one: http://wordpress.org/plugins/json-api/

After you receive the object you can do anything you need in your views.

## Simple usage

```javascript

  var wpnode = require('wp-node');

  wpnode.cache({
    url   : "https://maps.googleapis.com/maps/api/geocode/json",
    db    : db,   //set your mongo database
    qs    : {    //Define you query variables
      address : 11205,
      sensor  : false
    }
  }, function(r) {

    //Here's your cached data (r)
    

  });

```

### Setting a time to live

```javascript 
  wpnode.setGlobalOptions({
    TTL       : 86400,  //(Optional/Default) Cache time is in seconds.  This will cache the data for a day
    logger    : false,  //(Optional/Default) Turn on for debug mode
    db        : db,     //(Optional) Required if you don't plan to pass your mongo db object when calling the cache method
    endpoint  : 'http://www.yourwordpress.com/api/' //(Required in order to generate a sitemap)
  })
```

## WordPress Functions (Alpha)

### Helping with sitemaps

```javascript

wpnode.generateSiteMap({
      pre_link: '/blog/post'
    }, function(err, posts){

    if (err) {
      console.log(err.message);
      return;
    }
  })

```