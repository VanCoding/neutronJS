exports.id = "text";
exports.componentPath = require.resolve("./component.jade");
exports.load = function(website,data,cb){
    if(!data.html) data.html = "Put some <b>text</b> here";
    cb();
}
exports.save = function(website,data,cb){
    cb();
}
