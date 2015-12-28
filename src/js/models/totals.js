define(['backbone'], function(Backbone) {
  // Starting values for the running daily totals displayed in the left-hand div
  var Totals = Backbone.Model.extend({
    defaults: function() {
      return {
        calories: 0,
        totFat: 0,
        satFat: 0,
        sodium: 0,
        date: 0
      };
    }
  });
  return Totals;
});
