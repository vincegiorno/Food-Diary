  // Cache jQuery objects, create messages object, declare app-wide variables
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


  // View for displaying the totals
  var TotalsView = Backbone.View.extend({

    className: 'row',

    //template: _.template($('#totals-template').html()),

    // Model will be passed in on instantiation
    initialize: function() {
      this.template = _.template($('#totals-template').html());
      this.render();
      this.listenTo(this.model, 'change', this.render);
      // A foodView signals 'countFood' when a food is added or servings increased
      this.listenTo(messages, 'countFood', this.adjustTotalsUp);
      // or 'adjustTotalsDown' when servings are decreased
      this.listenTo(messages, 'adjustTotalsDown', this.adjustTotalsDown);
      // appView signals 'newDay' when 'New day' button is clicked
      this.listenTo(messages, 'newDay', this.saveDay);
    },

    render: function() {
      totalsDiv.empty();
      this.$el.empty();
      this.$el.append(this.template(this.model.toJSON()));
      totalsDiv.append(this.$el);
    },

    /* Update daily totals when food added or servings incremented. The relevant
    food model is passed in as @data. */
    adjustTotalsUp: function(data) {
      this.model.set({
        calories: this.model.get('calories') + data.get('calories'),
        totFat: this.model.get('totFat') + data.get('totFat'),
        satFat: this.model.get('satFat') + data.get('satFat'),
        sodium: this.model.get('sodium') + data.get('sodium')
      });
    },

    /* Update daily totals when servings decremented. The relevant
    food model is passed in as @data. */
    adjustTotalsDown: function(data) {
      this.model.set({
        calories: this.model.get('calories') - data.get('calories'),
        totFat: this.model.get('totFat') - data.get('totFat'),
        satFat: this.model.get('satFat') - data.get('satFat'),
        sodium: this.model.get('sodium') - data.get('sodium')
      });
    },

    /* Before instantiating a new day, set the 'today' property of the previous
    day to the current time so the past days are ordered correctly, then close it.
    A new day has this property set to 0 to identify it as the current day. */
    saveDay: function() {
      var today = Date.now();
      this.model.set({
        date: today
      });
      this.close();
    }
  });

  // Set up collection defaults, Firebase connection
  var Days = Backbone.Firebase.Collection.extend({

    //model: Totals,

    // The URL cannot be set when main.js loads, because it can depend on user input
    initialize: function() {
      this.model = Totals;
      this.url = fbUrl + id + '/days';
    }
  });

  // Draw a graph showing total calories for previous days, up to 14 days
  var Graph = Backbone.View.extend({

    el: '#graph',

    initialize: function() {
      // Draw a new graph when a new day is added to the collection
      this.listenTo(this.collection, 'add', this.render);
      this.ctx = this.el.getContext('2d');
      // Draw initial graph when the app starts
      this.render();
    },

    render: function() {
      var xPadding = 30,
        yPadding = 20,
        yMax = 0,
        yMin = 20000,
        xScale,
        yScale,
        yInterval,
        points,
        data = [],
        count,
        width,
        height,
        ctx = this.ctx;
      graphDiv.removeClass('hidden'); // In case 'hidden' was set previously
      // Set width dynamically
      width = this.el.width = graphDiv.width() - 5;
      // Compress graph on small screens
      if (window.screen.width < 700) {
        this.el.height = 170;
        //yPadding = 10;
        ySteps = 5;
      } else {
        this.el.height = 280;
        ySteps = 10;
      }
      height = this.el.height - 20; // leave room for x-axis label
      ctx.clearRect(0, 0, width, height);
      // Get all previous saved days
      points = this.collection.filter(function(day) {
        return day.get('date') !== 0;
      });
      // Don't graph if less than 2 points
      if (points.length < 2) {
        this.graphAlert();
        return;
      }
      // Limit the days to no more than 14
      if (points.length > 14) {
        points = points.slice(points.length - 14);
      }
      // Extract total calories from each day, find min and max values
      count = points.length;
      for (var i = 0; i < count; i++) {
        var y = data[i] = points[i].get('calories');
        yMin = y < yMin ? y : yMin;
        yMax = y > yMax ? y : yMax;
      }
      // Don't graph, show message if totals all 0
      if (yMax === 0) {
        this.graphAlert();
        return;
      }
      // Round yMin down and yMax up to nearest 100
      yMin -= yMin % 100 + 100;
      yMin = yMin < 0 ? 0 : yMin; // Avoid a negative value
      yMax += 100 - yMax % 100;
      // Set graph parameters
      yScale = (height - yPadding) / (yMax - yMin);
      yInterval = (yMax - yMin) / (ySteps);
      xScale = (width - xPadding - 5) / (count - 1);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Draw y and then x axis //
      ctx.moveTo(xPadding, yPadding);
      ctx.lineTo(xPadding, height);
      ctx.lineTo(width, height);
      ctx.stroke();
      // Fill in y-axis interval labels
      ctx.textBaseline = 'middle';
      for (i = 0; i <= ySteps; i++) {
        ctx.fillText(yMax - i * yInterval, 0, (yPadding + (i * height / (ySteps + 1))));
      }
      // Add x-axis label
      ctx.textBaseline = top;
      ctx.fillText('Calorie totals for the last ' + count + ' days', 60, height + 10);
      // Plot line graph
      ctx.beginPath();
      ctx.strokeStyle = '#337ab7';
      ctx.moveTo(xPadding, height - (data[0] - yMin) * yScale);
      for (i = 1; i < count; i++) {
        ctx.lineTo(xPadding + xScale * i, height - (data[i] - yMin) * yScale);
      }
      ctx.stroke();
      // Plot data points
      for (i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.arc(xPadding + xScale * i, height - (data[i] - yMin) * yScale, 2, 0, 2 * Math.PI, true);
        ctx.fill();
      }
      // Show button to hide graph on small screens in portrait
      if (window.screen.width < 400) {
        graphBtn.removeClass('hidden');
      } else {
        graphBtn.addClass('hidden');
      }
    },

    // If graph cannot be drawn, display message briefly then hide graph div
    graphAlert: function() {
      alertGraph.removeClass('hidden');
      setTimeout(function() {
        alertGraph.addClass('hidden');
        graphDiv.addClass('hidden');
      }, 3000);
    }
  });

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
      messages.trigger('countFood', this.model);
      // Add to Today list; no net effect if already on it
      this.model.set({
        today: true
      });
      // Message to check if food from database is already on My Food list
      if (whichList === 'apiResults') {
        messages.trigger('foodToAdd', this.model);
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
      if (whichList === 'today') {
        this.$('.option').text(newServings);
      }
      return false;
    },

    // Only available if Today or My Food lists are open
    removeFood: function() {
      // Remove if not on Today list
      if (!this.model.get('today')) {
        // Message to remove from Foods collection
        messages.trigger('removeFood', this.model);
        // Today list can't be open, so message to re-render updated My List
        messages.trigger('reviseMyList');
        return;
      }
      /* On Today list, so alert if trying to remove from other list. Test is
      more general in case other lists were to be added */
      if (whichList !== 'today') {
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
        messages.trigger('adjustTotalsDown', this.model);
        // Servings = 1, so decrement & remove from Today list
      } else {
        this.model.set({
          servings: newServings
        });
        this.model.set({
          today: false
        });
        messages.trigger('adjustTotalsDown', this.model);
        // Message to re-render updated Today list
        messages.trigger('reviseToday');
      }
    }
  });


  var FoodList = Backbone.Firebase.Collection.extend({

    //model: Food,

    initialize: function() {
      this.model = Food;
      this.url = fbUrl + id + '/food';
      // A foodview signals when a food is added or removed
      this.listenTo(messages, 'foodToAdd', this.checkFood);
      this.listenTo(messages, 'removeFood', this.removeFood);
      // appView signals to close any open list before a new one open
      this.listenTo(messages, 'closeList', this.clearShow);
      // appview signals when a new day is started
      this.listenTo(messages, 'newDay', this.clearToday);
      // appview signals when
      this.listenTo(messages, 'searchList', this.searchList);
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
      messages.trigger('listSearchComplete', found);
    },

    removeFood: function(food) {
      this.remove(food);
    }
  });

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
      this.listenTo(messages, 'showMyList', this.showAll);
      // Remove view if a different list will be opened
      this.listenTo(messages, 'closeList', this.close);
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
      if (whichList !== 'results') {
        list.$('.item').hover(function() {
          $(this).find('.delete').css('visibility', 'visible');
        }, function() {
          $(this).find('.delete').css('visibility', 'hidden');
        });
      }
      foodTable.append(list.$el);
    },

    // Set title, last field heading and 'show' property flag to display the Today list
    showToday: function() {
      title.html('Today');
      optionHead.html('#');
      done.addClass('hidden');
      whichList = 'today';
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
        title.html('Add to Today');
        optionHead.text('+');
        this.render(true);
        done.removeClass('hidden');
        whichList = 'results';
      } else {
        // Use title field to display failure message
        title.html('No matches. Try again or search the database');
      }
    },

    // Set title, last field heading, 'show' flag and enable the 'Done' button to display My List
    showAll: function() {
      // if My List is already displayed, do nothing
      if (whichList === 'all') {
        return;
      }
      title.html('My List');
      optionHead.text('+');
      this.collection.each(function(food) {
        food.set({
          show: true
        });
      });
      this.render(true);
      done.removeClass('hidden');
      whichList = 'all';
    }
  });

  // Set up view to display results from online database
  var ApiResultsView = Backbone.View.extend({

    tagName: 'tbody',

    // Results from API call passed in as @params.results
    initialize: function(params) {
      title.html('Add to Today');
      whichList = 'apiResults';
      this.results = params.results;
      // Remove view if a different or new API results list will be displayed
      this.listenTo(messages, 'closeList', this.close);
      this.render();
      // Set last field header
      optionHead.text('+');
    },

    render: function() {
      var view, food, fields;
      // Build food models from returned results
      for (var i = 0; i < this.results.length; i++) {
        fields = this.results[i].fields;
        food = new Food({
          itemId: fields.item_id,
          item: fields.item_name,
          brand: fields.brand_name,
          calories: fields.nf_calories,
          totFat: fields.nf_total_fat,
          satFat: fields.nf_saturated_fat,
          sodium: fields.nf_sodium,
          servings: 1
        });
        // Build a foodView for each model
        view = new FoodView({
          model: food
        });
        // Final column has the 'Add' option
        view.$('.option').text('Add');
        // Build HTML in default div to avoid separate renders for each food
        this.$el.append(view.$el);
      }
      this.$('.delete').css('visibility', 'hidden');
      // Insert into DOM with one draw
      foodTable.append(this.$el);
      done.removeClass('hidden');
    }
  });

  var AppView = Backbone.View.extend({

    el: 'body',

    initialize: function() {
      // instantiate the totals model, days collection of daily totals and first totals view
      days = new Days();
      foodList = new FoodList();
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
      // foodListView messages when collection search results are ready
      this.listenTo(messages, 'listSearchComplete', this.openListResults);
      // A foodView messages when a food is removed
      this.listenTo(messages, 'reviseMyList', this.showMyList);
      // A foodView messages when a food's servings decrease to 0
      this.listenTo(messages, 'reviseToday', this.goToday);
    },

    events: {
      'click #new-day': 'changeDay', // 'New day' button
      'click #search-dbase': 'searchAPI', // 'in database' button
      'click #search-my-list': 'searchList', // 'in My Food' button
      'click #show-list': 'showMyList', // 'My List' button
      'click #graph-btn': 'toggleGraph', // 'Hide/Show graph' button
      'click #done': 'goToday' // 'Done' button
    },

    /* When a user clicks the 'New day' button */
    changeDay: function() {
      // Signal totalsViw to save the old day and foodList to clear the Today list
      messages.trigger('newDay');
      // Close any open list
      messages.trigger('closeList');
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

    // Database call
    searchAPI: function() {
      // Grab and check searchbox text
      var phrase = searchBox.val();
      console.log(phrase);
      if (phrase === '') {
        return false;
      }
      phrase = encodeURIComponent(phrase); // format for URL query string
      var queryUrl = ntrxUrl + phrase; // URL base stored in config.js
      /* Close any open list. If the search returns results, these will be displayed
      instead. If not, a message will be displayed in the table title graph. */
      messages.trigger('closeList');
      // Change the value of the search button to indicate a seach is in progress
      searchDbase.attr('value', 'Searching...');
      $.getJSON(queryUrl, ntrxParams) // search params stored in config.js
        .done(function(result) {
          var results = result.hits;
          searchDbase.attr('value', 'in database');
          if (results.length === 0) {
            title.html('No matches. Try again or search the database.');
          } else {
            // Pass results to initialize new results list display
            apiResultsView = new ApiResultsView({
              results: results
            });
          }
        })
        .fail(function() {
          title.html('Search request failed. Please check your Internet connection and try again.');
        });
      return false;
    },

    // Initiate search on foodList collection
    searchList: function(phrase) {
      phrase = searchBox.val();
      if (phrase === '') {
        return false;
      }
      // Close any open list to display results or failure message
      messages.trigger('closeList');
      // Signal foodList to perform search
      messages.trigger('searchList', phrase);
      return false;
    },

    // show My Food List
    showMyList: function() {
      messages.trigger('closeList'); // Close any open list
      foodListView = new FoodListView({
        collection: foodList,
        // Option 'all' parameter will cause foodListView to display My Food
        option: 'all'
      });
      // Hide My List button since My Food list will be open
      listBtn.addClass('hidden');
      return false;
    },

    /* Allow user to hide or show graph on phones in portrait view, where the graph
    takes up the full width of the screen under the totals display */
    toggleGraph: function() {
      if (graphDiv.hasClass('hidden')) {
        graphDiv.removeClass('hidden');
        graphBtn.text('Hide graph');
      } else {
        graphDiv.addClass('hidden');
        graphBtn.text('Show graph');
      }
    },

    // Show Today list
    goToday: function() {
      messages.trigger('closeList');
      // Null 'option' parameter will cause foodListView to display Today
      foodListView = new FoodListView({
        collection: foodList
      });
      listBtn.removeClass('hidden');
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
    }
  });

  var totalsDiv = $('#totals-div'),
    searchBox = $('#searchbox'),
    searchDbase = $('#search-dbase'),
    searchMyList = $('#search-my-list'),
    listBtn = $('#show-list'),
    graphDiv = $('#graph-div'),
    alertGraph = $('#alert-graph'),
    graphBtn = $('#graph-btn'),
    title = $('#table-title'),
    done = $('#done'),
    optionHead = $('#option-head'),
    foodTable = $('#food-table'),
    signIn = $('#sign-in'),
    idBox = $('#idBox'),
    inputError = $('#input-error'),
    messages = _.extend({}, Backbone.Events),
    totals, days, totalsView,
    foodList, foodListView,
    graph,
    whichList, // whichList keeps track of which list is being displayed
    apiResultsView,
    appView;

  Backbone.View.prototype.close = function() {
    this.undelegateEvents();
    this.remove();
    whichList = '';
  };

  var id = localStorage.getItem('food-diary-id');
  // id will be used to access the proper Firebase data
  if (id) {
    /* Firebase addresses are URLs, so illegal characters must be replaced. For
    some reason, this must be done twice or Firebase throws an error. The user
    input string is encoded before being put in local storage. It is encoded
    a second time here. */
    id = encodeURIComponent(id).replace(/\./g, '%2E');
    startUp();
  } else {
    signIn.modal({
      // Prevent user from dismissing modal so they must enter id
      keyboard: false
    });
    signIn.modal('show');
    $('#sign-in-button').click(processId); // Activate 'Submit' button
  }

  // Handle string user inputs in modal textbox
  function processId() {
    var userInput = idBox.val();
    // Check for valid email format
    var checkString = /^\S+([\.-]?\S+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    // If invalid, display warning. Modal stays open until valid string entered.
    if (!checkString.test(userInput)) {
      inputError.removeClass('hidden');
      setTimeout(function() {
        inputError.addClass('hidden');
      }, 3000);
      return;
    } else {
      // Encode valid input to remove illegal characters & put in local storage
      id = encodeURIComponent(userInput).replace(/\./g, '%2E');
      localStorage.setItem('food-diary-id', id);
      // Encode again so Firebase doesn't throw error
      id = encodeURIComponent(id).replace(/\./g, '%2E');
      // Hide the modal ans start the app
      signIn.modal('hide');
      startUp();
    }
  }

  // Sets up the app as an instance of AppView, or displays an error message
  function startUp() {
    try {
      appview = new AppView();
    } catch (e) { // Replaces the alert text used when a graph cannot be diplayed, adds red background
      alertGraph.text('Sorry, but the app was unable to start. Please check your Internet connection ' +
        'and try again, or try later.');
      alertGraph.addClass('alert alert-danger');
      alertGraph.removeClass('hidden');
    }
  }
