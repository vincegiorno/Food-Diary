define(["jquery","backbone","underscore","setup"],function(t,e,s,o){var a=e.View.extend({className:"row",initialize:function(){this.template=s.template(t("#totals-template").html()),this.render(),this.listenTo(this.model,"change",this.render),this.listenTo(o.messages,"countFood",this.adjustTotalsUp),this.listenTo(o.messages,"adjustTotalsDown",this.adjustTotalsDown),this.listenTo(o.messages,"newDay",this.saveDay)},render:function(){o.totalsDiv.empty(),this.$el.empty(),this.$el.append(this.template(this.model.toJSON())),o.totalsDiv.append(this.$el)},adjustTotalsUp:function(t){this.model.set({calories:this.model.get("calories")+t.get("calories"),totFat:this.model.get("totFat")+t.get("totFat"),satFat:this.model.get("satFat")+t.get("satFat"),sodium:this.model.get("sodium")+t.get("sodium")})},adjustTotalsDown:function(t){this.model.set({calories:this.model.get("calories")-t.get("calories"),totFat:this.model.get("totFat")-t.get("totFat"),satFat:this.model.get("satFat")-t.get("satFat"),sodium:this.model.get("sodium")-t.get("sodium")})},saveDay:function(){var t=Date.now();this.model.set({date:t}),this.close()}});return a});