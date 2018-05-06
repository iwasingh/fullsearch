const User = require('../types/user/definitions/server/index.js');
const elasticlunr = require('elasticlunr');
//@TODO search-config file with all indexOn like firebase db rules. The config will be grap from there
//PRIVATE
var Factory = function(Provider, obj){
    return (new Provider()).elasticlunr(obj);
}

//PUBLIC
// @TODO a way to get the config file(indexes)
// automatically based on required indexes under /server/index.js of each model
var Search = function(ref, provider, indexes){
    this.config = {
        index: elasticlunr.Index.load(JSON.parse(JSON.stringify(indexes))),
        status: false
    };

    this.ref = ref;

    // The model of the entity: eg. User, Club
    this.provider = provider;
};

Search.prototype.init = function(){
    var _self = this;

      if(!this.config.status) {

        this.config.status = new Promise((resolve, reject) => {

          _self.ref.once("value", function(snap) {

            var list = snap.val();
            Object.keys(list).forEach(function(item, c){

              var obj = new Factory(_self.provider, list[item]);
              _self.config.index.addDoc(obj);

            });

            _self._watchForChanges();
            return resolve(_self.config.index);
          });
        });
      }
return this.config.status;
}

Search.prototype._watchForChanges = function(){

  var _self = this;

  this.ref.on('child_added', function(snap){
    var obj = new Factory(_self.provider, snap.val());
    _self.config.index.addDoc(obj);
  });

  this.ref.on('child_changed', function(snap){
    var obj = new Factory(_self.provider, snap.val());
    _self.config.index.updateDoc(obj);
  });

  this.ref.on('child_removed', function(snap){
    _self.config.index.removeDocByRef(snap.key);
  });
  return this;

}

Search.prototype.fullSearch = function(str, fields, exp = true){
    return this.config.index.search(str, {
       expand:exp,
       fields:fields
     });
}
module.exports = Search;

