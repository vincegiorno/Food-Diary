define([], function() {

  var appId = '7fe99a0e';
  var appKey = '2e8422defebd45960525ef1136a3fd46';
  var fbUrl = 'https://blinding-torch-4046.firebaseIO.com/food-diary/';
  var ntrxUrl = 'https://api.nutritionix.com/v1_1/search/';
  var ntrxParams = {
    results: '0:30',
    fields: 'item_id,item_name,brand_name,nf_calories,nf_total_fat,nf_saturated_fat,nf_sodium',
    appId: appId,
    appKey: appKey
  };

  return {
    fbUrl: fbUrl,
    ntrxUrl: ntrxUrl,
    ntrxParams: ntrxParams
  };
});
