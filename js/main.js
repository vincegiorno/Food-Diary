$(function(){ // wrap in onReady function so DOM is ready for Backbone and code is isolated

// stand-in method for generating unique IDs
var id = localStorage.getItem('food-diary-id');
if (!id) {
    id = Date.now();
    localStorage.setItem('food-diary-id', id);
}

// cache jQuery objects, create messages object, declare app-wide variables
var totalsDiv = $('#totals-div'),
    searchBtn = $('#search-btn'),
    title = $('#table-title'),
    done = $('#done'),
    optionHead = $('#option-head'),
    foodTable = $('#food-table'),
    messages = _.extend({}, Backbone.Events),
    totals, days, totalsView,
    foodList, foodListView,
    apiResultsView, appView,
    whichList; // whichList keeps track of which list is being displayed

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


// the view for displaying the totals
var TotalsView = Backbone.View.extend({
        
    template: _.template($('#totals-template').html()),
    
    // the model and messages object will be passed in on instantiation
    initialize: function() {
        this.render();   
        //this.listenTo(this.model, 'change', this.render);
        // addFood and addServing will be sent from clicks on a FoodView
  		this.listenTo(messages, 'addFood', this.updateTotals);
  		this.listenTo(messages, 'addServing', this.updateTotals);
        this.listenTo(messages, 'changeDay', this.newDay, this);
    },
    
    // handlers for the New Day, Search (Submit) and Show My Food List buttons
    
    render: function() {
        this.$el.append(this.template(this.model.toJSON()));
        this.$el.appendTo(totalsDiv);
        return this;
    },
    
    /* When user starts a new day, use the accumulated totals to create a new Day object and
    store it in the days collection. Reset daily totals. */
    // TODO: change to create model first so daily totals will persist across sessions
    newDay: function() {
        this
        messages.trigger('changeDay', this.model);
    },
       
    // update daily total
    updateTotals: function(data) {
        this.model.save({
            calories: this.model.get('calories') + data.get('calories'),
            totFat: this.model.get('totFat') + data.get('totFat'),
            satFat: this.model.get('satFat') + data.get('satFat'),
            sodium: this.model.get('sodium') + data.get('sodium')

        })
    },
    
    renderTotals: function() {
        
    }
});
    
// set up collection defaults, Firebase connection
var Days = Backbone.Firebase.Collection.extend({
    
    model: Totals,
    
    url: fbUrl + 'food-diary/' + id + '/days',
});

// set up model for food items
var Food = Backbone.Model.extend({
    defaults: function() {
      return {
          servings: 1,
          // today property will be used for flagging items to display in Today's Food list
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
        /* Clicking on the last display field will either add a food to Today's Food, 
        if My Food List or list search results are displayed (field will display 'Add'), or
        increase servings by 1 if Today's Food is displayed (field will display # of servings).
        A double-click won't work on the former because the first click will trigger an add. */
        'click .option': 'addIfLink',
        'dblclick .option': 'incrementServings'
    },
    
    render: function() {
        this.$el.append(this.template(this.model.toJSON()));
        //this.$el.append(this.template(this.model.attributes.model.attributes));
        return this;
    },
    
    // check for 'Add' in field so single click on servings won't trigger
    addIfLink: function() {
        if (whichList !== 'today') {
           messages.trigger('addFood', this.model);
       }
        return false;
    },
    
    incrementServings: function() {
        // TODO: reset servings on new day
        var newServings = parseInt(this.model.get('servings') + 1);
        this.model.save({servings: newServings});
        messages.trigger('addServing', this.model);
        return false;
    }
});
    
    
var FoodList = Backbone.Firebase.Collection.extend({
    
    model: Food,
    
    url: fbUrl + 'food-diary/' + id + '/food',
});
    
/* Set up list views for Today's Food, My Food List and resluts of searching My Food List, 
all of which use the same basic list, showing or hiding items as appropriate. */
var FoodListView = Backbone.View.extend({
    
    tagName: 'tbody',
    
    /* which list to initialize is passed in as the option parameter,
    defaulting to Today's Food if option is null */
    initialize: function (params){
        this.option = params.option;
        // searchList signals to display search results from My Food List
        this.listenTo(messages, 'searchList', this.showResults);
        // addFood signals to add a food already on My food List to Today's Food
        this.listenTo(messages, 'addFood', this.addFood);
        // showMyList signals to show My Food List
        this.listenTo(messages, 'showMyList', this.showAll);
        // remove view if API search returns success
        this.listenTo(messages, 'closeListView', this.close);
        switch (this.option) {
            case 'all':
                this.showAll();
                break;
            case 'results':
                this.showResults();
                break;
            default:
                this.showToday();
        }
    },
        
    events: {
        // return to Today's Food list when finished adding new items
        'click #done': 'showToday'
    },
    
    render: function(optionAdd) {
        var view,
            list = this;
        foodList.each(function(food) {
            if (food.get('show')) {
                view = new FoodView({model: food});
                if (optionAdd) {
                    this.$('.option').html('Add');
                    console.log(this.$('.option').html());
                }
            }
            view.$el.appendTo(list.$el);
        });
        foodTable.append(list.$el);
    },
    
    // set title, last field heading and 'show' property flag to display Today's Food 
    showToday: function() {
        title.html('Today\'s Food');
        optionHead.html('Servings');
        done.addClass('hidden');
        whichList = 'today';
        foodList.each(function(food) {
            console.log(food);
            console.log(food.get('today'));
            if (food.get('today')) {
                food.set({show: true});
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
            item = food.get('item');
            for (var i = words.length; i; i--) {
                // set display flag to false and break loop if any term is not found
                if (item.indexOf(words[i]) < 0) {
                    showThis = false;
                    break;
                }
            }
            // if all terms were found, flag is still set to true
            food.set({show: showThis});
            if (showThis) {
                found = true;
            }
        });
        // display results if at least one match found
        if (found) {
            title.html('Foods found on my list');
            optionHead.html('Add today');
            done.removeClass('hidden');
            whichList = 'listResults';
        } else {
            // use title field to display failure message
            title.html('try again or search the database');
        }
        this.render(true);
    },
    
    // set title, last field heading and 'show' property flag to display My Food List
    showAll: function() {
        // if My Food List is already displayed, do nothing
        if (whichList === 'all') {
            return;
        }
        title.html('My Food List');
        optionHead.html('Add today');
        foodList.each(function(food) {
            food.set({show: true});
        });
        this.render(true);
        done.removeClass('hidden');
        whichList = 'all';
    },
    
    // adding a food already on My Food List sets today property flag to true
    // TODO: increment servings if already on Today's Food (totalsView handles daily total)
    addFood: function(food) {
        food.set({today: true});
        return false;
    }        
});

// set up view to display API results
var ApiResultsView = Backbone.View.extend({
    
    tagName: 'tbody',
            
    initialize: function(params) {
        apiViewOpen = true;
        title.html('Add any of these to Today\'s Food');
        // results from call and messages object passed in on instantiation
        whichList = 'apiResults';
        this.results = params.results;
        //addFood will be triggered by click event set on each FoodView
        this.listenTo(messages, 'addFood', this.addFood);
        // remove view if new API search returns success
        this.listenTo(messages, 'successAPI', this.close);
        // remove view if Show My List button clicked
        this.listenTo(messages, 'closeApiResults', this.close);
        this.render();
        // set last field header
        optionHead.html('Add today');
    },
    
    events: {
        // go back to Today's Food view if done adding food(s)
        'click #done': 'switchView'
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
            });
            view = new FoodView({model: food});
            view.$('.option').html('Add');
            // append to default div to limit draws
            this.$el.append(view.$el);
        }
        // replace placeholder row with one draw
        foodTable.append(this.$el);
        done.removeClass('hidden');
    },
    
    // add food to Today's Food (and My Food List)
    addFood: function(food) {
        // don't add if already on list
        // TODO: increase servings (totalsView handles totals)
        var found = foodList.findWhere({itemId: food.get('itemId')});
        if (found) {
            return;
        } else {
            foodList.add(food.attributes);
        }
    }
});
    
var AppView = Backbone.View.extend({
    
    el: 'body',
   
    initialize: function() {
        // instantiate the totals model, days collection of daily totals and first totals view
        days = new Days;
        foodList = new FoodList;
        days.on('sync', function() {
            totalsView = new TotalsView({model: days.findWhere({date: 0}) || new Totals});
            days.add(totalsView.model.toJSON);
        });
        foodList.on('sync', function() {
            foodListView = new FoodListView({});
        });
    },
    
    events: {
        'click #new-day': 'changeDay',
        'click #search-btn': 'search',
        'click #show-list': 'showMyList'
    },
    
    changeDay: function() {
        //totalsView.model.save({date: Date.now()});
        totalsView.close();
        totalsView = new TotalsView({model: new Totals});
        days.add(totalsView.model.toJSON);
    },
    
    // rout search to stored My Food List or AJAX call to Nutrionix API
    search: function() {
        searchPhrase = $('#searchbox').val();
        if ($('#list-search').prop('checked')) {
            // searching My Food List will show or hide cached items
            messages.trigger('searchList', searchPhrase);
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
        searchBtn.attr('value', 'Searching...');
        $.getJSON(queryUrl,ntrxParams) // search params stored in config.js
            .done(function(result) {
                var results = result.hits;
                searchBtn.attr('value', 'Submit');
                messages.trigger('closeListView'); // signal to remove foodListView if open
                messages.trigger('closeApiResults'); // signal to remove apiResultsView if open
                // pass results to initialize new results list display
                apiResultsView = new ApiResultsView({results: results});
        })
            .fail(function() {
            searching.html('Search request failed. Please check your Internet connection and try again');
        });
    },
     
    // show My Foods List
    showMyList: function() {
        // if apiResultsView is open, close it and initialize foodListView to show the whole list
        messages.trigger('closeListView'); // signal to remove foodListView if open
        messages.trigger('closeApiResults'); // signal to remove apiResultsView if open
        foodListView = new FoodListView({option: 'all'});
        return false;
    },
    
    goToday: function() {
        if (whichList = 'apiResults') {
            apiResultsView.close();
            foodListView = new FoodListView;
        }
        else {
            messages.trigger('goToday');
        }
    }
});

appView = new AppView;

});

