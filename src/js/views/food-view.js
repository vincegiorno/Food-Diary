describe(['jquery', 'backbone', 'underscore', 'setup'], function($, Backbone, _, app) {

  // Build html to display food item as a row in the food table, which all lists use.
  var FoodView = Backbone.View.extend({

    tagName: 'tr',

    //template: _.template($('#food-template').html()),

    initialize: function() {
      this.template = _.template($('#food-template').html());
      this.render();
    },

    events: {
      /* Clicking on the last display field will either add a food to Today,
      if the My Food list or list search results are displayed (field will display 'Add'), or
      increase servings by 1 if Today is displayed (field will display # of servings). */
      'click .option': 'addFood', // 'Add' or # servings button
      'click .delete': 'removeFood' // Rollover delete button after food item name
    },

    render: function() {
      this.$el.append(this.template(this.model.toJSON()));
      return this;
    },

    // When the Add button or number of servings in the last food table column is clicked
    addFood: function() {
      // Message to update totals for any food selected
      app.messages.trigger('countFood', this.model);
      // Add to Today list; no net effect if already on it
      this.model.set({
        today: true
      });
      // Message to check if food from database is already on My Food list
      if (app.whichList === 'apiResults') {
        app.messages.trigger('foodToAdd', this.model);
      } else {
        // If from Today or My Food lists, increase number of servings
        this.incrementServings();
      }
      // All event handlers return false to prevent bubbling up and default page refresh
      return false;
    },

    // Update servings on food model
    incrementServings: function() {
      var newServings = this.model.get('servings') + 1;
      this.model.set({
        servings: newServings
      });
      // Change displayed # servings if Today list is open
      if (app.whichList === 'today') {
        this.$('.option').text(newServings);
      }
      return false;
    },

    // Only available if Today or My Food lists are open
    removeFood: function() {
      // Remove if not on Today list
      if (!this.model.get('today')) {
        // Message to remove from Foods collection
        app.messages.trigger('removeFood', this.model);
        // Today list can't be open, so message to re-render updated My List
        app.messages.trigger('reviseMyList');
        return;
      }
      /* On Today list, so alert if trying to remove from other list. Test is
      more general in case other lists were to be added */
      if (app.whichList !== 'today') {
        alert('Foods on the Today list cannot be removed');
        return;
      }
      // On Today list and Today is the open list, so decrease # servings
      var newServings = this.model.get('servings') - 1;
      // Servings > 1, so decrement & adjust totals
      if (newServings) {
        this.model.set({
          servings: newServings
        });
        this.$('.option').text(newServings);
        // Update totals
        app.messages.trigger('adjustTotalsDown', this.model);
        // Servings = 1, so decrement & remove from Today list
      } else {
        this.model.set({
          servings: newServings
        });
        this.model.set({
          today: false
        });
        app.messages.trigger('adjustTotalsDown', this.model);
        // Message to re-render updated Today list
        app.messages.trigger('reviseToday');
      }
    }
  });
  return FoodView;
});
