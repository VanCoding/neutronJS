function List(id,opts){
    this.label = opts.label||id;
    this.defaultColumns = opts.defaultColumns||[];
    this.defaultSort = opts.defaultSort||[];
    this.searchFields = opts.searchFields||[];
    this.columns = {};   
}

List.prototype.add = function(columns){
    for(var column in columns){
        this.columns[column] = columns[column];
    }
}

List.prototype.init = function(website,router){
    var self = this;
    router.get("/query",function(req,res){
        
    });
    router.get("/:id",function(req,res){
        
    })
    router.post("/:id",function(req,res){
        
    })    
}

List.prototype.componentPath = require.resolve("./list.jade");

module.exports = List;