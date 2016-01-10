### In a nutshell
**Food Diary** keeps a record of daily calorie, fat and sodium intake. It uses the Nutrionix database to access nutrition information. In order to run the app, clone the repository and open *dist/index.html*

### The nut
+ Lists of food eaten on the current day and all foods selected while using the app are maintained, updated in real time and persevered in Firebase
+ Foods can be added to the daily list by searching the Nutrionix database or the personal list; they can also be removed from both lists
+ Running totals for calories, total fat, saturated fat and sodium are kept and displayed for the current day
+ Calorie totals going back 14 days are displayed in a graph

###The shell
To get started you need to enter an email address. This is just to ensure (in a casual way) that each user has a unique ID. The address is not used for any other purpose. This address is stored on your device in local storage with the key 'food-diary-id'. As long as you use the same email address, you should be able to use the app with your stored data on any other device as well. If you enter a wrong address (you see no data or the wrong data), or if the app says it cannot start and you know your Internet connection is good, click the `Reset` button, and you will be prompted to enter your email address again. The button is visible when you mouse over (or click on, when using a touch device) the "Today's totals" title, or the adjoining space where the hidden button is located. **Do not try to set the 'food-diary-id' value manually, since the app encodes the value before storing it to replace illegal Firebase address characters.** 

Search for foods using the searchbox.
+ Use the 2 buttons below it to search either the online database or your personal list. By default, hitting `Enter` to perform a seach will search the online database. You can also display all the foods in My List at any time by clicking the `My List` button.
+ Select from the displayed results by clicking on the `Add` button in the last column of the food table (the column header displays `+`). You can use more search terms or brand names to narrow a search. When you select a food, it is added to the Today table of food for the current day (as well as My List if it is not already on it) and the daily totals are updated. Click the `Done` button to return to the Today table. You can also click on the number of servings of any food displayed in the Today table (the column header displays `#`) to add another serving of that food.

A delete button `x` will show you when roll over (or tap on a touch screen) any food name in the Today or My List tables. Clicking on it in the Today table will reduce the number of servings for that food by 1, or remove it if the number of servings is 1. Clicking on it in the My List table will remove it from your personal list, *but a food cannot be removed from My List while it appears in the Today table.*

Click on the `New day` button to clear the daily totals and start over again for another day. *This does not happen automatically, and you cannot return to a previous day.* The app keeps only the totals for previous days.

Once you have data saved for 2 previous days, the app will display a graph showing calorie totals for previous days, for a maximum of 14 days. Once you have more than 14 previous days, the earliest will drop off the graph each time a new day is added.

P.S. If you know how to get around the formatting hacks I used to get Backbone (adding and retrieving new objects before using them) and Firebase (double encoding) to play nice, please drop me a line at vincegiorno324@gmail.com **Thanks!**
