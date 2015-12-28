describe(['backbone', 'firebase', 'setup', 'config', 'backfire', 'food'], function(Backbone, Firebase, app, config) {

  var FoodList = Backbone.Firebase.Collection.extend({

    initialize: function(model, options) {
      var id = options.id;
      this.model = Food;
      this.url = config.fbUrl + id + '/food';
      // A foodview signals when a food is added or removed
      this.listenTo(app.messages, 'foodToAdd', this.checkFood);
      this.listenTo(app.messages, 'removeFood', this.removeFood);
      // appView signals to close any open list before a new one open
      this.listenTo(app.messages, 'closeList', this.clearShow);
      // appview signals when a new day is started
      this.listenTo(app.messages, 'newDay', this.clearToday);
      // appview signals when
      this.listenTo(app.messages, 'searchList', this.searchList);
    },

    // See if food from database is already in collection
    checkFood: function(food) {
      var found = this.findWhere({
        itemId: food.get('itemId')
      });
      // If not, add it. New food has 1 as default # servings.
      if (!found) {
        this.add(food.attributes);
        // If it is, increment servings by 1 and update model
      } else {
        var newServings = found.get('servings') + 1;
        found.set({
          servings: newServings
        });
      }
    },

    /* Set all foods to not display. This is necessary when lists are closed, so
    the next list displayed will not retain all the items from the old list */
    clearShow: function() {
      var foodArray = [];
      this.each(function(food) {
        food.set({
          show: false
        });
        foodArray.push(food);
      });
      this.reset(foodArray);
    },

    /* Empty the Today list and set servings of all foods on My List to 0
    when a new day is started */
    clearToday: function() {
      var foodArray = [];
      this.each(function(food) {
        food.set({
          today: false,
          servings: 0
        });
        foodArray.push(food);
      });
      this.reset(foodArray);
    },

    // Search for foods on My List, which could grow quite large over time
    searchList: function(phrase) {
      // turn search phrase into array of terms
      var words = phrase.split(' '),
        showThis,
        item,
        found,
        foodArray = []; // foodArray will hold the matches
      // Search each item's name field for each search term
      this.each(function(food) {
        // Set display flag to true
        showThis = true;
        item = food.get('item');
        item = item.toLowerCase();
        for (var i = words.length - 1; i >= 0; i--) {
          // Break loop and set display flag to false if any term is not found
          if (item.indexOf(words[i].toLowerCase()) < 0) {
            showThis = false;
            break;
          }
        }
        // If all terms were found, display flag is still set to true
        food.set({
          show: showThis
        });
        if (showThis) {
          // At least one food item matched
          found = true;
        }
        foodArray.push(food);
      });
      this.reset(foodArray);
      // Message appView so it can display the results
      app.messages.trigger('listSearchComplete', found);
    },

    removeFood: function(food) {
      this.remove(food);
    }
  });
  return FoodList;
});
