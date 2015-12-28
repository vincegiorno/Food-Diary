define(['jquery', 'backbone', 'underscore', 'setup'], function($, Backbone, _, app) {
  // View for displaying the totals
  var TotalsView = Backbone.View.extend({

    className: 'row',

    // Model will be passed in on instantiation
    initialize: function() {
      this.template = _.template($('#totals-template').html());
      this.render();
      this.listenTo(this.model, 'change', this.render);
      // A foodView signals 'countFood' when a food is added or servings increased
      this.listenTo(app.messages, 'countFood', this.adjustTotalsUp);
      // or 'adjustTotalsDown' when servings are decreased
      this.listenTo(app.messages, 'adjustTotalsDown', this.adjustTotalsDown);
      // appView signals 'newDay' when 'New day' button is clicked
      this.listenTo(app.messages, 'newDay', this.saveDay);
    },

    render: function() {
      app.totalsDiv.empty();
      this.$el.empty();
      this.$el.append(this.template(this.model.toJSON()));
      app.totalsDiv.append(this.$el);
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

  return TotalsView;
});
