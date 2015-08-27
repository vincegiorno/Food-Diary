$(function(){ // wrap in onReady function so DOM is ready for and code is isolated

// stand-in method for generating unique IDs
var id = localStorage.getItem('food-diary-id');
if (!id) {
    id = Date.now();
    localStorage.setItem('food-diary-id', id);
}

// caching jQuery objects and creating a messages object
var searching = $('#searching'),
    title = $('#table-title'),
    done = $('#done'),
    optionHead = $('#option-head'),
    placeholder = $('#placeholder'),
    messages = _.extend({}, Backbone.Events);

// grabbed from online as a way to remove views and associated handlers
Backbone.View.prototype.close = function() {
    this.undelegateEvents();
    this.remove();
}

// the starting values for the running daily totals displayed in the left-hand div
var Totals = Backbone.Model.extend({
    defaults: function() {
      return {
        calories: 0,
        totFat: 0,
        satFat: 0,
        sodium: 0
      };
    }
});

// instantiate the first totals model
var totals = new Totals;

// the view for displaying the totals
var TotalsView = Backbone.View.extend({
    
    el: '#totals-div',
    
    template: _.template($('#totals-template').html()),
    
    // the model and messages object will be passed in on instantiation
    initialize: function(params) {
        this.model = params.model;
        this.messages = params.messages;
        this.render();   
        this.listenTo(this.model, 'change', this.render);
        // addFood and addServing will be sent from clicks on a FoodView
  		this.messages.on("addFood", this.updateTotals, this);
  		this.messages.on("addServing", this.updateTotals, this);
    },
    
    // handlers for the New Day, Search (Submit) and Show My Food List buttons
    events: {
        'click #new-day': 'newDay',
        'click #search-btn': 'search',
        'click #show-list': 'showListMessage'
    },
    
    render: function() {
        this.$el.append(this.template(this.model.toJSON()));
        return this;
    },
    
    /* When user starts a new day, use the accumulated totals to create a new Day object and
    store it in the days collection. Reset daily totals. */
    // TODO: change to create model first so daily totals will persist across sessions
    newDay: function() {
        days.create({
            calories: this.model.calories,
            totFat: this.model.totFat,
            satFat: this.model.satFat,
            sodium: this.model.sodium,
            date: Date.now()
        })
        this.model.save( {
            calories: 0,
            totFat: 0,
            satFat: 0,
            sodium: 0
            
        });
        // message so average for past days can be recalculated
        // TODO implement previous days functionality
        this.messages.trigger('changeDay', this.model);
        return false;
    },
    
    // rout search to stored My Food List or AJAX call to Nugrionix API
    search: function() {
        searchPhrase = $('#searchbox').val();
        if ($('#list-search').prop('checked')) {
            // searching My Food List will show or hide cached items
            this.messages.trigger('searchList', searchPhrase);
        } else {
            this.searchAPI(searchPhrase);
        }
        return false; // stop page from refreshing, which will reset right-hand div
    },
    
    // API call
    searchAPI: function(phrase) {
        var self = this,
            searchWords = escape(phrase); // format for URL query string
        var queryUrl = ntrxUrl + searchWords; // URL base stored in config.js
        searching.html('Searching...'); // TODO: doesn't work
        $.getJSON(queryUrl,ntrxParams) // search params stored in config.js
            .done(function(result) {
                var results = result.hits;
                self.messages.trigger('successAPI'); // signal to remove other list view
                // view initialization will handle display
                // TODO: fix problem that new results can't be displayed on top of old ones
                apiResultsView = new ApiResultsView({results: results, messages: self.messages});
        })
            .fail(function() {
            searching.html('Search request failed. Please check your Internet connection and try again');
        });
    },
    
    // show My Foods List
    showListMessage: function() {
        this.messages.trigger('showMyList');
        return false;
    },
    
    // update daily total
    updateTotals: function(data) {
        this.model.save({
            calories: this.model.get('calories') + data.get('calories'),
            totFat: this.model.get('totFat') + data.get('totFat'),
            satFat: this.model.get('satFat') + data.get('satFat'),
            sodium: this.model.get('sodium') + data.get('sodium')

        })
    }
});
    
// instantiate the totals view (left-hand div)
var totalsView = new TotalsView({model: totals, messages: messages});

// set up collection defaults, Firebase connection
var Days = Backbone.Firebase.Collection.extend({
    
    model: Totals,
    
    url: fbUrl + 'food-diary/' + id + '/days',
});

// instantiate days collection to keep totals for each day
var days = new Days;

// set up model for food items
var Food = Backbone.Model.extend({
    defaults: function() {
      return {
          servings: 1,
          // today property will be used for flagging items to display in Today's Food list
          today: true
      };
    }
});

/* Build html to place food item into the right-hand div table, which is the list display.
Each item will be one row. */
var FoodView = Backbone.View.extend({
    
    tagName: 'tr',
    
    template: _.template($('#food-template').html()),
    
    initialize: function(params) {
        // the model and messages object will be passed in on instantiation
        this.model = params.model;
        this.messages = params.messages;
        this.render();
    },
    
    events: {
        /* Clicking on the last display field will either add a food to Today's Food, 
        if My Food List or list search results are displayed (field will display 'Add', or
        increase servings by 1 if Today's Food is displayed (field will display # of servings).
        A double-click won't work on the former because the first click will trigger an add. */
        'click .option': 'addIfLink',
        'dblclick .option': 'incrementServings'
    },
    
    render: function() {
        this.$el.html(this.template(this.model));
        return this;
    },
    
    // check for 'Add' in field so single click on servings won't trigger
    addIfLink: function() {
       if (this.$('.option').html() === 'Add') {
           this.messages.trigger('addFood', this.model);
       }
        return false;
    },
    
    incrementServings: function() {
        // increment & save for daily list, signal for daily total to update
        // TODO: reset servings on new day
        var newServings = parseInt(this.model.get('servings') + 1);
        this.model.save({servings: newServings});
        this.messages.trigger('addServing', this.model);
        return false;
    }
});
    
    
var FoodList = Backbone.Firebase.Collection.extend({
    
    model: Food,
    
    url: fbUrl + 'food-diary/' + id + '/food',
});
    
var foodList = new FoodList;

/* Set up list views for Today's Food, My Food List and resluts of searching My Food List, 
all of which use the same basic list, showing or hiding items as appropriate. */
var FoodListView = Backbone.View.extend({
    
    initialize: function(params) {
        // array or collection and messages object passed in on instantiation
        this.foodList = params.foodList;
        this.messages = params.messages;
        // Today's Food is the default display when the app starts up
        this.showToday();
        // searchList signals to display search results from My Food List
        this.listenTo(this.messages, 'searchList', this.showResults);
        // successAPI signals to remove the Foodlist view
        this.listenTo(this.messages, 'successAPI', this.close);
        // addFood signals to add a food already on My food List to Today's Food
        this.listenTo(this.messages, 'addFood', this.addFood);
        // showMyList signals to show My Food List
        this.listenTo(this.messages, 'showMyList', this.showAll);
    },
    
    events: {
        // return to Today's Food list when finished adding new items
        'click #done': 'showToday'
    },
    
    render: function(optionAdd) {
        var view;
        // use the full My Food List
        foodList.each(function(food) {
            view = new FoodView({model: food, messages: messages});
            // don't display if not on Today's Food or if not in search results
            if (!food.model.get('show')) {
                view.$el.addClass('hidden');
            } else {
                // change # of servings to 'Add' if My Food List or search results
                if (optionAdd) {
                    this.$('.option').html('Add');
                }
            }
            /* TODO: rewrite to build list on this.$el and then replace placeholder <tr>,
            like in ApiResultsView. But this broke app on the first try. */
            view.$el.appendTo($('#food-table'));
        });
    },
    
    // set title, last field heading and 'show' property flag to display Today's Food 
    showToday: function() {
        title.html('Today\'s Food');
        optionHead.html('Servings');
        done.addClass('hidden');
        foodList.each(function(food) {
            if (food.model.get('today')) {
                food.model.set({show: true});
            }
        });
        this.render();
        return false;
    },
    
    // filter list for search results
    showResults: function(phrase) {
        // turn search phrase into array of terms
        var words = phrase.split(' '),
            showThis,
            item,
            found;
        // search each item name field for each search term
        foodlist.each(function(food) {
            // set display flag to true
            showThis = true;
            item = food.model.get('item');
            for (var i = words.length; i; i--) {
                // set display flag to false and break loop if any term is not found
                if (item.indexOf(words[i]) < 0) {
                    showThis = false;
                    break;
                }
            }
            // if all terms were found, flag is still set to true
            food.model.set({show: showThis});
            if (showThis) {
                found = true;
            }
        });
        // display results if at least one match found
        if (found) {
            title.html('Foods found on my list');
            optionHead.html('Add today');
            done.removeClass('hidden');
        } else {
            // use title field to display failure message
            title.html('try again or search the database');
        }
        this.render(true);
    },
    
    // set title, last field heading and 'show' property flag to display My Food List
    showAll: function() {
        // if My Food List is already displayed, do nothing
        if (title.html() === 'My Food List') {
            return;
        }
        title.html('My Food List');
        optionHead.html('Add today');
        foodList.each(function(food) {
            food.model.set({show: true});
        });
        this.render(true);
    },
    
    // adding a food already on My Food List sets today property flag to true
    // TODO: increment servings if already on Today's Food (totalsView handles daily total)
    addFood: function(food) {
        food.set({today: true});
        this.showToday;
        return false;
    }        
});

// instantiate list view
var foodListView = new FoodListView({foodList: foodList, messages: messages});

// set up view to display API results
var ApiResultsView = Backbone.View.extend({
            
    initialize: function(params) {
        apiViewOpen = true;
        title.html('Add any of these to Today\'s Food');
        // results from call and messages object passed in on instantiation
        this.results = params.results;
        this.messages = params.messages;
        // addFood will be triggered by click event set on each FoodView
        this.listenTo(this.messages, 'addFood', this.addFood);
        this.render();
        // set last field header
        optionHead.html('Add today');
    },
    
    events: {
        // go back to Today's Food view if done adding food(s)
        'click #done': 'switchView'
    },
    
    render: function() {
        var view, fields;
        // food items not stored in Foods collection until added, so passed as array
        for (var i = 0; i < this.results.length; i++) {
            fields = this.results[i].fields;
            // each FoodView model has to be built
            view = new FoodView({model: {
                itemId: fields.item_id,
                item: fields.item_name,
                brand: fields.brand_name,
                calories: fields.nf_calories,
                totFat: fields.nf_total_fat,
                satFat: fields.nf_saturated_fat,
                sodium: fields.nf_sodium,
                servings: 1
            }, messages: messages});
            view.$('.option').html('Add');
            // append to default div to limit draws
            this.$el.append(view.$el);
        }
        // replace placeholder row with one draw
        placeholder.replaceWith(this.$el.html());
        done.removeClass('hidden');
    },
    
    // return to Today's Food if done adding food(s)
    switchView: function() {
        foodListView = new FoodListView;
    },
    
    // add food to Today's Food (and My Food List)
    addFood: function(food) {
        // don't add if already on list
        // TODO: increase servings (totalsView handles totals)
        var found = foodList.findWhere({itemId: food.get('itemId')});
        if (found) {
            return;
        } else {
            //TODO: rewrite to manually create new Food and add to Foods collection
            foodList.create(food);
        }
    }
});

var apiResultsView; // only initialized on search      

});

