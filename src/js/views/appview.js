define(['jquery', 'backbone', 'setup', 'config', 'models/totals', 'views/totals-view',
  'collections/days', 'views/graph', 'collections/foodlist', 'views/foodlist-view', 'views/api-results-view'
], function($, Backbone, app, config, Totals, TotalsView, Days, Graph, FoodList, FoodListView, ApiResultsView) {

  var totals, days, totalsView,
    foodList, foodListView,
    graph,
    apiResultsView,
    appView;

  var AppView = Backbone.View.extend({

    el: 'body',

    initialize: function(model, options) {
      var id = options.id;
      // instantiate the totals model, days collection of daily totals and first totals view
      days = new Days([], {
        id: id
      });
      foodList = new FoodList([], {
        id: id
      });
      /* Anytime the app is used with an established id, it will always have a current day open
      with the date property set to 0. A new totalsView needs to be instantiated the first time
      an id is used. */
      days.once('sync', function() {
        totalsView = new TotalsView({
          model: days.findWhere({
            date: 0
          }) || new Totals()
        });
        /* For consistency in handling Day objects, they all need to be fetched from the
        days collection, so any new totalsView is added to the collection, with the date
        set to 0, then closed and then fetched back from it. Calling 'add' on a totalsView
        that already exists has no effect, so in this case it is simply opened twice. */
        days.add(totalsView.model.attributes);
        totalsView.close();
        totalsView = new TotalsView({
          model: days.findWhere({
            date: 0
          })
        });
        // Initialize the graph view
        graph = new Graph({
          collection: days
        });
      });
      // Fetch the stored food data
      foodList.once('sync', function() {
        foodListView = new FoodListView({
          collection: foodList
        });
      });

      $('.btn-warning').css('visibility', 'hidden');
      $('#totals-title').hover(function() {
        $(this).children('.btn-warning').css('visibility', 'visible');
      }, function() {
        $(this).children('.btn-warning').css('visibility', 'hidden');
      });

      // foodListView messages when collection search results are ready
      this.listenTo(app.messages, 'listSearchComplete', this.openListResults);
      // A foodView app.messages when a food is removed
      this.listenTo(app.messages, 'reviseMyList', this.showMyList);
      // A foodView app.messages when a food's servings decrease to 0
      this.listenTo(app.messages, 'reviseToday', this.goToday);
    },

    events: {
      'click #new-day': 'changeDay', // 'New day' button
      'click #reset': 'reset', // 'Reset' button
      'click #search-dbase': 'searchAPI', // 'in database' button
      'click #search-my-list': 'searchList', // 'in My Food' button
      'click #show-list': 'showMyList', // 'My List' button
      'click #graph-btn': 'toggleGraph', // 'Hide/Show graph' button
      'click #done': 'goToday' // 'Done' button
    },

    /* When a user clicks the 'New day' button */
    changeDay: function() {
      if (totalsView.model.get('calories') === 0) {
        return false;
      }
      // Signal totalsViw to save the old day and foodList to clear the Today list
      app.messages.trigger('newDay');
      // Close any open list
      this.closeLists();
      // Same workaround as in initialize
      totalsView = new TotalsView({
        model: new Totals()
      });
      days.add(totalsView.model.attributes);
      totalsView.close();
      totalsView = new TotalsView({
        model: days.findWhere({
          date: 0
        })
      });
      foodListView = new FoodListView({
        collection: foodList
      });
    },

    reset: function() {
      localStorage.clear('food-diary-id');
      document.location.reload(true);
    },

    // Database call
    searchAPI: function() {
      // Grab and check searchbox text
      var phrase = app.searchBox.val();
      if (phrase === '') {
        return false;
      }
      phrase = encodeURIComponent(phrase); // format for URL query string
      var queryUrl = config.ntrxUrl + phrase; // URL base stored in config.js
      /* Close any open list. If the search returns results, these will be displayed
      instead. If not, a message will be displayed in the table title graph. */
      this.closeLists();
      // Change the value of the search button to indicate a seach is in progress
      app.searchDbase.attr('value', 'Searching...');
      $.getJSON(queryUrl, config.ntrxParams) // search params stored in config.js
        .done(function(result) {
          var results = result.hits;
          app.searchDbase.attr('value', 'in database');
          if (results.length === 0) {
            app.title.html('No matches. Try again or search the database.');
          } else {
            // Pass results to initialize new results list display
            apiResultsView = new ApiResultsView({
              results: results
            });
          }
        })
        .fail(function() {
          app.title.html('Search request failed. Please check your Internet connection and try again.');
        });
      return false;
    },

    // Initiate search on foodList collection
    searchList: function(phrase) {
      phrase = app.searchBox.val();
      if (phrase === '') {
        return false;
      }
      // Close any open list to display results or failure message
      this.closeLists();
      // Signal foodList to perform search
      app.messages.trigger('searchList', phrase);
      return false;
    },

    // show My Food List
    showMyList: function() {
      this.closeLists(); // Close any open list
      foodListView = new FoodListView({
        collection: foodList,
        // Option 'all' parameter will cause foodListView to display My Food
        option: 'all'
      });
      // Hide My List button since My Food list will be open
      app.listBtn.addClass('hidden');
      return false;
    },

    /* Allow user to hide or show graph on phones in portrait view, where the graph
    takes up the full width of the screen under the totals display */
    toggleGraph: function() {
      if (app.graphDiv.hasClass('hidden')) {
        app.graphDiv.removeClass('hidden');
        app.graphBtn.text('Hide graph');
      } else {
        app.graphDiv.addClass('hidden');
        app.graphBtn.text('Show graph');
      }
    },

    // Show Today list
    goToday: function() {
      this.closeLists();
      // Null 'option' parameter will cause foodListView to display Today
      foodListView = new FoodListView({
        collection: foodList
      });
      app.listBtn.removeClass('hidden');
      scrollTo(0, 0); // Top of page might be out of view
    },

    // Display results from search on foodList collection
    openListResults: function(isFound) {
      // Option 'results' will cause foodListView to display collection search results
      foodListView = new FoodListView({
        collection: foodList,
        option: 'results',
        isFound: isFound
      });
    },

    // Utility to close lists and reset whichList
    closeLists: function() {
      app.messages.trigger('closeList');
      app.whichList = '';
    }
  });

  return AppView;
});
