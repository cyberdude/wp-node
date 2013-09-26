# wp-node

Caches WordPress in mongo using a JSON API.

You can use either WordPress Public API or another plugin like this one: http://wordpress.org/plugins/json-api/

After you receive the object you can do anything you need in your views.

## Simple usage

```javascript

  var wpnode = require('wp-node');

  wpnode.cache({
    url: "https://maps.googleapis.com/maps/api/geocode/json?address=11205&sensor=false",
    db: db,  //set your mongo database
  }, function(r) {

    //Here's your cached data (r)
    

  });

```

### Setting a time to live

```javascript 
  wpnode.setGlobalsOptions({
    TTL: 86400  //Cache time is in seconds.  This will cache the data for a day
  })
```
