define(['backbone'], function(Backbone) {

  // Set up model for food items
  var Food = Backbone.Model.extend({
    defaults: function() {
      return {
        // set default for every field in case returned data is incomplete
        itemId: '',
        item: '',
        brand: '',
        calories: 0,
        totFat: 0,
        satFat: 0,
        sodium: 0,
        servings: 0,
        // today property will be used for flagging items to display in Today list
        today: true,
      };
    }
  });

  return Food;
});
