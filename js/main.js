$(function(){ // wrap in onReady function so DOM is ready for Backbone and code is isolated

// stand-in method for generating unique IDs
var id = localStorage.getItem('food-diary-id');
if (!id) {
    id = Date.now();
    localStorage.setItem('food-diary-id', id);
}

// cache jQuery objects, create messages object, declare app-wide variables
var totalsDiv = $('#totals-div'),
    searchBox = $('#searchbox'),
    searchDbase = $('#search-dbase'),
    searchMyList = $('#search-my-list'),
    graphDiv = $('#graph-div'),
    graphBtn = $('#graph-btn'),
    title = $('#table-title'),
    done = $('#done'),
    optionHead = $('#option-head'),
    foodTable = $('#food-table'),
    messages = _.extend({}, Backbone.Events),
    totals, days, totalsView,
    foodList, foodListView,
    graph,
    apiResultsView,
    appView,
    whichList; // whichList keeps track of which list is being displayed

// grabbed from online as a way to remove views and associated handlers
Backbone.View.prototype.close = function() {
    this.undelegateEvents();
    this.remove();
    whichList = '';
};

// the starting values for the running daily totals displayed in the left-hand div
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


// the view for displaying the totals
var TotalsView = Backbone.View.extend({

    className: 'row',

    template: _.template($('#totals-template').html()),

    // the model and messages object will be passed in on instantiation
    initialize: function() {
      this.render();
      this.listenTo(this.model, 'change', this.render);
      // countFood message will be sent from clicks on a FoodView
  		this.listenTo(messages, 'countFood', this.adjustTotalsUp);
  		this.listenTo(messages, 'servingAdded', this.adjustTotalsUp);
      this.listenTo(messages, 'adjustTotalsDown', this.adjustTotalsDown);
      // saveDay message is sent from click event on New Day button
      this.listenTo(messages, 'newDay', this.saveDay);
    },

    render: function() {
        totalsDiv.empty();
        this.$el.empty();
        this.$el.append(this.template(this.model.toJSON()));
        totalsDiv.append(this.$el);
    },

    // update daily total
    adjustTotalsUp: function(data) {
        this.model.set({
            calories: this.model.get('calories') + data.get('calories'),
            totFat: this.model.get('totFat') + data.get('totFat'),
            satFat: this.model.get('satFat') + data.get('satFat'),
            sodium: this.model.get('sodium') + data.get('sodium')
        });
    },

    adjustTotalsDown: function(data) {
        this.model.set({
            calories: this.model.get('calories') - data.get('calories'),
            totFat: this.model.get('totFat') - data.get('totFat'),
            satFat: this.model.get('satFat') - data.get('satFat'),
            sodium: this.model.get('sodium') - data.get('sodium')
        });
    },

    saveDay: function() {
        var today = Date.now();
        this.model.set({date: today});
        this.close();
    }
});

// set up collection defaults, Firebase connection
var Days = Backbone.Firebase.Collection.extend({

    model: Totals,

    url: fbUrl + id + '/days',

    initialize: function() {
        this.listenTo(messages, 'newTotals', this.addNewTotals);
    },

    addNewTotals: function(totalsModel) {
        this.add(totalsModel);
    }
});

var Graph = Backbone.View.extend({

    el: '#graph',

    initialize: function() {
        this.listenTo(this.collection, 'add', this.render);
        //this.el.width = this.width;
        this.el.height = 280;
        this.ctx = this.el.getContext('2d');
        this.render();
    },

    render: function() {
        var xPadding = 30,
            yPadding = 20,
            yMax = 0,
            yMin = 20000,
            xScale,
            yScale,
            points,
            data = [],
            count,
            interval,
            graphMin,
            width,
            height,
            ctx = this.ctx;
        width = this.el.width = graphDiv.width();
        // compress graph on small screens
        if (window.screen.width < 700) {
            this.el.height = 160;
            yPadding = 10;
            ySteps = 5;
        } else {
            this.el.height = 270;
            ySteps = 10;
        }
        height = this.el.height - 20; // leave room for x-axis label
        ctx.clearRect(0, 0, width, height);
        points = this.collection.filter(function(day) {
            return day.get('date') !== 0;
        });
        count = points.length;
        points = count > 14 ? points.slice(count - 14) : points;
        for (var i = 0; i < count; i++) {
            var y = data[i] = points[i].get('calories');
            yMin = y < yMin ? y : yMin;
            yMax = y > yMax ? y : yMax;
        }
        count = points.length;
        // don't graph if totals all 0 or yMax - yMin > 5000
        if ((yMax === 0) || (yMax - yMin > 5000)) {
            alert('The data cannot be graphed. Either there is no data or the difference ' +
                 'between the highest and lowest totals is too large.');
            return;
            }
        // round yMin down and yMax up to nearest 100
        yMin -= yMin % 100 + 100;
        yMax += 100 - yMax % 100;
        xScale = (width - xPadding - 5)/(count - 1);
        yScale = (height - yPadding)/(yMax - yMin);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // draw y and then x axis //
        ctx.moveTo(xPadding, yPadding);
        ctx.lineTo(xPadding, height);
        ctx.lineTo(width, height);
        ctx.stroke();
        // determine y-axis intervals based on difference between yMin & yMax
        switch (Math.floor((yMax-yMin)/500)) {
            case 0:
                interval = 25;
                break;
            case 1:
                interval = 50;
                break;
            case 2:
                interval = 100;
                break;
            case 3:
            case 4:
            case 5:
                interval = 250;
                break;
            default:
                interval = 500;
        }
        // fill in y-axis interval labels
        interval = interval * 10 / ySteps; // double interval for small screen
        graphMin = Math.floor(yMin/interval);
        ctx.textBaseline = 'middle';
        for (i = 1; i <= ySteps; i++) {
            ctx.fillText(graphMin + i * interval, 0, height +10 - i * 25);
        }
        // add x-axis label
        ctx.textBaseline = top;
        ctx.fillText('Calorie totals for the last ' + count + ' days', 60, height + 10);
        // plot line graph
        ctx.beginPath();
        ctx.moveTo(xPadding, height - data[0] * yScale);
        for (i = 1; i < count; i++) {
            //console.log(xPadding + xScale * i, height - points[i].get('calories'));
            ctx.lineTo(xPadding + xScale * i, height - data[i] * yScale);
        }
        ctx.stroke();
        for (i = 0; i < count; i++) {
            ctx.beginPath();
            ctx.arc(xPadding + xScale * i, height - data[i] * yScale, 2, 0, 2 * Math.PI, true);
            ctx.fill();
        }
        if (window.screen.width < 400) {
            graphBtn.removeClass('hidden');
        } else {
            graphBtn.addClass('hidden');
        }
    }
});

// set up model for food items
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

/* Build html to place food item into the right-hand div table, which is the list display.
Each item will be one row. */
var FoodView = Backbone.View.extend({

    tagName: 'tr',

    template: _.template($('#food-template').html()),

    initialize: function() {
        this.render();
    },

    events: {
        /* Clicking on the last display field will either add a food to Today,
        if the My Food list or list search results are displayed (field will display 'Add'), or
        increase servings by 1 if Today is displayed (field will display # of servings). */
        'click .option': 'addFood',
        'click .delete': 'removeFood'
    },

    render: function() {
        this.$el.append(this.template(this.model.toJSON()));
        return this;
    },

    // only add food if Today is not the open list
    addFood: function() {
        messages.trigger('countFood', this.model);
        this.model.set({today: true});
        if (whichList === 'apiResults') {
            messages.trigger('foodToAdd', this.model);
        } else {
            this.incrementServings();
        }
        return false;
    },

    incrementServings: function() {
        var newServings = this.model.get('servings') + 1;
        this.model.set({servings: newServings});
        if (whichList === 'today') {
            this.$('.option').html(newServings);
        }
        return false;
    },

    removeFood: function() {
        // Remove if not on Today's Food list
        if (!this.model.get('today')) {
            messages.trigger('removeFood', this.model);
            messages.trigger('reviseMyList');
            return;
        }
        // Must be removed from Today's Food first
        if (whichList !== 'today') {
            alert('Foods on the Today\'s Food list cannot be removed');
            return;
        }
        // On Today's Food list
        var newServings = this.model.get('servings') - 1;
        // Servings > 1, so decrement & adjust totals
        if (newServings) {
            this.model.set({servings: newServings});
            this.$('.option').html(newServings);
            messages.trigger('adjustTotalsDown', this.model);
        // Servings = 1, so decrement & remove from Today's Food
        } else {
            this.model.set({servings: newServings});
            this.model.set({today: false});
            messages.trigger('adjustTotalsDown', this.model);
            messages.trigger('reviseToday');
        }
    }
});


var FoodList = Backbone.Firebase.Collection.extend({

    model: Food,

    url: fbUrl + id + '/food',

    initialize: function() {
        this.listenTo(messages, 'foodToAdd', this.checkFood);
        this.listenTo(messages, 'closeList', this.clearShow);
        this.listenTo(messages, 'newDay', this.clearToday);
        this.listenTo(messages, 'searchList', this.searchList);
        this.listenTo(messages, 'removeFood', this.removeFood);
    },

    checkFood: function(food) {
        var found = this.findWhere({itemId: food.get('itemId')});
        if (!found) {
            this.add(food.attributes);
        } else {
            var newServings = found.get('servings') + 1;
            found.set({servings: newServings});
        }
    },

    clearShow: function() {
      var foodArray = [];
        this.each(function(food) {
            food.set({show: false});
            foodArray.push(food);
        });
        this.reset(foodArray);
    },

    clearToday: function() {
        var foodArray = [];
        this.each(function(food) {
            food.set({today: false, servings: 0});
            foodArray.push(food);
        });
        this.reset(foodArray);
    },

    searchList: function(phrase) {
        // turn search phrase into array of terms
        var words = phrase.split(' '),
            showThis,
            item,
            found,
            foodArray = [];
        // search each item name field for each search term
        this.each(function(food) {
            // set display flag to true
            showThis = true;
            item = food.get('item');
            item = item.toLowerCase();
            for (var i = words.length - 1; i >= 0; i--) {
                // break loop and set display flag to false if any term is not found
                if (item.indexOf(words[i].toLowerCase()) < 0) {
                    showThis = false;
                    break;
                }
            }
            // if all terms were found, display flag is still set to true
            food.set({show: showThis});
            if (showThis) {
                // at least one food item matched
                found = true;
            }
            foodArray.push(food);
        });
        this.reset(foodArray);
        messages.trigger('listSearchComplete', found);
    },

    removeFood: function(food) {
        this.remove(food);
    }
});

/* Set up list views for Today's Food, My Food List and resluts of searching My Food List,
all of which use the same basic list, showing or hiding items as appropriate. */
var FoodListView = Backbone.View.extend({

    tagName: 'tbody',

    /* which list to initialize is passed in as the option parameter,
    defaulting to Today's Food if option is null */
    initialize: function (params){
        this.option = params.option;
        this.isFound = params.isFound;
        // 'resultsReady' signals to display search results from My Food
        this.listenTo(messages, 'resultsReady', this.showResults);
        // 'showMyList' signals to show My Food list
        this.listenTo(messages, 'showMyList', this.showAll);
        // remove view if API search returns success
        this.listenTo(messages, 'closeList', this.close);
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

   render: function(optionAdd) {
        var view,
            list = this;
        this.collection.each(function(food) {
            if (food.get('show')) {
                view = new FoodView({model: food});
                if (optionAdd) {
                    view.$('.option').html('Add');
                }
                if (whichList !== 'results') {
                    view.$('.item').hover( function() {
                        $(this).find('.delete').css('visibility', 'visible');
                    }, function() {
                        $(this).find('.delete').css('visibility', 'hidden');
                    });
                }
                view.$el.appendTo(list.$el);
            }
        });
       list.$(".delete").css('visibility', 'hidden');
       foodTable.append(list.$el);
    },

    // set title, last field heading and 'show' property flag to display Today's Food
    showToday: function() {
        title.html('Today\'s food');
        optionHead.html('#');
        done.addClass('hidden');
        whichList = 'today';
        this.collection.each(function(food) {
            if (food.get('today')) {
                food.set({show: true});
            } else{
                food.set({show: false});
            }
        });
        this.render();
        return false;
    },

    // filter list for search results
    showResults: function(isFound) {
        // display results if at least one match found
        if (isFound) {
            title.html('Matches found on my list');
            optionHead.html('Add today');
            this.render(true);
            done.removeClass('hidden');
            whichList = 'results';
        } else {
            // use title field to display failure message
            title.html('No matches. Try again or search the database');
        }
    },

    // set title, last field heading and 'show' property flag to display My Food List
    showAll: function() {
        // if My List is already displayed, do nothing
        if (whichList === 'all') {
            return;
        }
        title.html('My List');
        optionHead.html('Add today');
        this.collection.each(function(food) {
            food.set({show: true});
        });
        this.render(true);
        done.removeClass('hidden');
        whichList = 'all';
    }
});

// set up view to display API results
var ApiResultsView = Backbone.View.extend({

    tagName: 'tbody',

    initialize: function(params) {
        title.html('Add any of these to Today\'s Food');
        // results from call and messages object passed in on instantiation
        whichList = 'apiResults';
        this.results = params.results;
        // remove view if new API search returns success
        this.listenTo(messages, 'successAPI', this.close);
        // remove view if Show My List button clicked
        this.listenTo(messages, 'closeList', this.close);
        this.render();
        // set last field header
        optionHead.html('Add today');
    },

    render: function() {
        var view, food, fields;
        // food items not stored in Foods collection until added, so passed as array
        for (var i = 0; i < this.results.length; i++) {
            fields = this.results[i].fields;
            // each FoodView model has to be built
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
            view = new FoodView({model: food});
            view.$('.option').html('Add');
            // append to default div to limit draws
            this.$el.append(view.$el);
        }
        // replace placeholder row with one draw
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
        days.once('sync', function() {
            totalsView = new TotalsView({model: days.findWhere({date: 0}) || new Totals()});
            days.add(totalsView.model.attributes);
            totalsView.close();
            totalsView = new TotalsView({model: days.findWhere({date: 0})});
            graph = new Graph({collection: days});
        });
        foodList.once('sync', function() {
            foodListView = new FoodListView({collection: foodList});
        });
        this.listenTo(messages, 'listSearchComplete', this.openListResults);
        // 'reviseToday' signals to re-render Today's food
        this.listenTo(messages, 'reviseMyList', this.showMyList);
        this.listenTo(messages, 'reviseToday', this.goToday);
    },

    events: {
        'click #new-day': 'changeDay',
        'click #search-dbase': 'searchAPI',
        'click #search-my-list': 'searchList',
        'click #show-list': 'showMyList',
        'click #graph-btn': 'toggleGraph',
        'click #done': 'goToday'
    },

    /* When user starts a new day, use the accumulated totals to create a new Day object and
    store it in the days collection. Reset daily totals. */
    changeDay: function() {
        messages.trigger('newDay');
        messages.trigger('closeList');
        totalsView = new TotalsView({model: new Totals()});
        days.add(totalsView.model.attributes);
        totalsView.close();
        totalsView = new TotalsView({model: days.findWhere({date: 0})});
        foodListView = new FoodListView({collection: foodList});
    },

    // API call
    searchAPI: function() {
      var phrase = searchBox.val();
      console.log(phrase);
      if (phrase === '') {
          return false;
      }
      phrase = encodeURIComponent(phrase); // format for URL query string
      var queryUrl = ntrxUrl + phrase; // URL base stored in config.js
      messages.trigger('closeList');
      searchDbase.attr('value', 'Searching...');
      $.getJSON(queryUrl,ntrxParams) // search params stored in config.js
          .done(function(result) {
              var results = result.hits;
              searchDbase.attr('value', 'Submit');
              if (!results) {
                title.html('No matches. Try again or search the database');
              } else {
              // pass results to initialize new results list display
              apiResultsView = new ApiResultsView({results: results});
            }
      })
          .fail(function() {
          title.html('Search request failed. Please check your Internet connection and try again');
      });
      return false;
    },

    searchList: function(phrase) {
      phrase = searchBox.val();
      if (phrase === '') {
          return false;
      }
      messages.trigger('closeList');
      messages.trigger('searchList', phrase);
      return false;
    },

    // show My Foods List
    showMyList: function() {
        // if apiResultsView is open, close it and initialize foodListView to show the whole list
        messages.trigger('closeList'); // signal any open list view to close
        foodListView = new FoodListView({collection: foodList, option: 'all'});
        return false;
    },

    toggleGraph: function() {
        if (graphDiv.hasClass('hidden')) {
            graphDiv.removeClass('hidden');
        } else {
            graphDiv.addClass('hidden');
        }
    },

    goToday: function() {
        messages.trigger('closeList');
        foodListView = new FoodListView({collection: foodList});
    },

    openListResults: function(isFound) {
        foodListView = new FoodListView({collection: foodList, option: 'results', isFound: isFound});
    }
});

appView = new AppView();

});
