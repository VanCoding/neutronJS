exports.id = "area";
exports.componentPath = require.resolve("./component.jade");
exports.load = function(website,data,cb){
    if(!data.order || !data.widgets){
        data.order = [];
        data.widgets = {};
    }
    cb();
}
exports.save = function(website,data,cb){
    cb();
}