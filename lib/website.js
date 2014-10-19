var browserify = require("browserify");
var stream = require("stream");
var path = require("path");
var fs = require("fs");
var j2r = require("jade2react");
var React = require("react");
var express = require("express");
var base = require("./base.js");

function Website(url){
    var self = this;
    this.pages = {};
    this.router = new express.Router();
    this.router.get(url+"public/main.js",function(req,res){
        res.writeHead(200,"OK",{"Content-Type":"text/javascript"});
        res.end(self.buildjs);
    });
    this.router.use(url+"public/",express.static(path.resolve(__dirname,"../public")));
}

Website.prototype.build = function(dir,pages,cb){
    var self = this;

    var bundle = browserify({basedir:dir});
    var file = new stream.PassThrough();
    file.write("React = require('react');\r\nbase = require('"+path.resolve(__dirname,"./base.js").replace(/\\/g,"/")+"');\r\npages = {");

    var first = true;
    for(var page in pages){
        this.pages[page] = require(path.resolve(dir,pages[page]));
        file.write("\t"+page+":require('"+pages[page]+"')");
        if(first){
            first = false;
        }else{
            file.write(",");
        }
        file.write("\r\n");
    }
    file.write("};\r\n");
    file.end();

    bundle.add(file);
    bundle.transform(j2r,{global:true});
    bundle.bundle(function(err,buildjs){
        self.buildjs = buildjs;
        cb(err);
    });
}

Website.prototype.render = function(res,name,data){
    data.page = {
        canEdit:true,
        name:name,
        path:"/neutron/"
    }

    var component = base(data);
    component._store.pages = this.pages;
    res.writeHead(200,"OK",{"Content-Type":"text/html"});
    res.end(React.renderComponentToString(component));
}

module.exports = Website;
