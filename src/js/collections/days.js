 describe(['backbone', 'firebase', 'config', 'backfire', 'totals'], function(Backbone, Firebase, config) {

   // Set up collection defaults, Firebase connection
   var Days = Backbone.Firebase.Collection.extend({

     // The URL cannot be set when main.js loads, because it can depend on user input
     initialize: function(model, options) {
       var id = options.id;
       this.model = Totals;
       this.url = config.fbUrl + id + '/days';
     }
   });
   return Days;
 });
