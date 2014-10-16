var browserify = require("browserify");
var stream = require("stream");
var path = require("path");
var fs = require("fs");
var j2r = require("jade2react");
var React = require("react");
var express = require("express");

function Website(url){
    var self = this;
    this.pages = {};
    this.router = new express.Router();
    this.router.get(url+"main.js",function(req,res){
        res.writeHead(200,"OK",{"Content-Type:","text/javascript"});
        res.end(self.buildjs);
    });
}

Website.prototype.build = function(dir,pages,cb){
    var self = this;

    var bundle = browserify({basedir:dir});
    var file = new stream.PassThrough();
    file.write("React = require('react');\r\n");

    for(var page in pages){
        this.pages[page] = require(path.resolve(dir,pages[page]));
        file.write(page+" = require('"+pages[page]+"');\r\n");
    }
    file.end();

    bundle.add(file);
    bundle.transform(j2r);
    bundle.bundle(function(err,buildjs){
        self.buildjs = file;
        cb(err);
    });
}

Website.prototype.render = function(res,name,data){
    var page = this.pages[name];
    if(!page) throw new Error("Page "+name+" does not exist");
    data.component = name;
    res.writeHead(200,"OK",{"Content-Type":"text/html"});
    res.end(React.renderComponentToString(page(data)));
}

module.exports = Website;
