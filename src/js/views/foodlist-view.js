describe(['jquery', 'backbone', 'setup'], function($, Backbone, app) {

/* Set up list views for Today, My Food and results of searching My Food list,
all of which use the same collection, showing or hiding items as appropriate. */
var FoodListView = Backbone.View.extend({

  tagName: 'tbody',

  /* The list to initialize and whether a search of My List returned results are
  passed in as @params.option and @params.isFound */
  initialize: function(params) {
    this.option = params.option;
    this.isFound = params.isFound;
    // appView sends 'showMyList' message to show My Food list
    this.listenTo(app.messages, 'showMyList', this.showAll);
    // Remove view if a different list will be opened
    this.listenTo(app.messages, 'closeList', this.close);
    // Show My List, search results or Today (default) based on value of 'option'
    switch (this.option) {
      case 'all':
        this.showAll();
        break;
      case 'results':
        this.showResults(this.isFound);
        break;
      default:
        this.showToday();
    }
  },

  /* @optionAdd is a flag to display 'Add' instead of hte number of servings
  in the last column of the food table */
  render: function(optionAdd) {
    var view,
      list = this;
    /* Traverse the collection, creating and appending a foodview for each
    food that has 'show' set to true */
    list.collection.each(function(food) {
      if (food.get('show')) {
        view = new FoodView({
          model: food
        });
        if (optionAdd) {
          view.$('.option').text('Add');
        }
        view.$el.appendTo(list.$el);
      }
    });
    // Only activate the remove button if Today or My List are displayed
    list.$('.delete').css('visibility', 'hidden');
    if (app.whichList !== 'results') {
      list.$('.item').hover(function() {
        $(this).find('.delete').css('visibility', 'visible');
      }, function() {
        $(this).find('.delete').css('visibility', 'hidden');
      });
    }
    app.foodTable.append(list.$el);
  },

  // Set title, last field heading and 'show' property flag to display the Today list
  showToday: function() {
    app.title.html('Today');
    app.optionHead.html('#');
    app.done.addClass('hidden');
    app.whichList = 'today';
    this.collection.each(function(food) {
      if (food.get('today')) {
        food.set({
          show: true
        });
      } else {
        food.set({
          show: false
        });
      }
    });
    this.render();
    return false;
  },

  // Set title, last field heading and enable the 'Done' button to display search results
  showResults: function(isFound) {
    // Display results if at least one match found
    if (isFound) {
      app.title.html('Add to Today');
      app.optionHead.text('+');
      this.render(true);
      app.done.removeClass('hidden');
      app.whichList = 'results';
    } else {
      // Use title field to display failure message
      app.title.html('No matches. Try again or search the database');
    }
  },

  // Set title, last field heading, 'show' flag and enable the 'Done' button to display My List
  showAll: function() {
    // if My List is already displayed, do nothing
    if (app.whichList === 'all') {
      return;
    }
    app.title.html('My List');
    app.optionHead.text('+');
    this.collection.each(function(food) {
      food.set({
        show: true
      });
    });
    this.render(true);
    app.done.removeClass('hidden');
    app.whichList = 'all';
  }
});
return FoodListView;
});
