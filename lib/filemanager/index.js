var express = require("express");
var mongo = require("mongodb");
var Grid = require("gridfs-stream");
var async = require("async");

exports.id = "files";
exports.label = "Dateien";
exports.componentPath = require.resolve("./component.jade");
exports.init = function(website,router){
    var db = website.db;
    router.put("/:parent([0-9a-fA-F]{24}|root)/:filename",function(req,res){
        var parent = req.params.parent=="root"?null:mongo.ObjectID(req.params.parent);
        var filename = req.params.filename;

        var id = mongo.ObjectID();
        if(req.headers["content-type"] == "text/directory"){
            db.collection("files.files").insert({_id:id,parent:parent,filename:filename,contentType:"text/directory"},function(err){
                if(err) return res.status(500).end();
                res.writeHead(200,"OK",{"Content-Type":"application/json"});
                res.end(JSON.stringify({_id:id,filename:filename,contentType:"text/directory"}));
            });
        }else{
            var grid = new Grid(db,mongo);
            var stream = grid.createWriteStream({
                _id:id,
                filename:filename,
                mode:"w",
                content_type:req.headers["content-type"],
                root:"files"
            });

            req.pipe(stream.on("close",function(){
                db.collection("files.files").update({_id:id},{$set:{parent:parent}},function(err){
                    if(err) return res.status(500).end();
                    res.writeHead(200,"OK",{"Content-Type":"application/json"});
                    res.end(JSON.stringify({_id:id,filename:filename,contentType:req.headers["content-type"]}));
                });
            }));
        }
    });

    router.get("/:id([0-9a-fA-F]{24})?",function(req,res){
        var id = req.params.id?mongo.ObjectID(req.params.id):null;

        if(id == null){
            serveDir();
        }else{
            db.collection("files.files").findOne({_id:id},{filename:true,contentType:true},function(err,file){
                if(err) return res.status(500).end();
                if(!file) return res.status(404).end();

                if(file.contentType == "text/directory"){
                    serveDir();
                }else{
                    var store = new mongo.GridStore(db,id,file.filename,"r",{root:"files"});
                    store.open(function(err,gs){
                        if(err) return res.status(500).end();
                        res.writeHead(200,"OK",{"Content-Type":file.contentType});

                        var stream = store.stream();
                        stream.on("data",function(d){
                            res.write(d);
                        })
                        stream.on("end",function(){
                            res.end();
                        })
                    })
                }
            });
        }



        function serveDir(){
            db.collection("files.files").find({parent:id},{filename:true,contentType:true}).toArray(function(err,files){
                if(err) return res.status(500).end();
                res.writeHead(200,"OK",{"Content-Type":"application/json"});
                res.end(JSON.stringify(files));
            });
        }
    });


    router.delete("/:id([0-9a-fA-F]{24})",function(req,res){
        var id = mongo.ObjectID(req.params.id);
        db.collection("files.files").findOne({_id:id},{contentType:true,filename:true},function(err,item){
            if(err) return res.status(500).end();
            if(!item) return res.status(404).end();

            deleteItem(item,function(err){
                if(err) return res.status(500).end();
                res.end();
            });
        });
    });

    function deleteItem(item,cb){
        if(item.contentType == "text/directory"){
            db.collection("files.files").find({parent:item._id},{contentType:true,filename:true}).toArray(function(err,files){
                if(err) return cb(err);
                async.each(files,deleteItem,function(err){
                    if(err) return cb(err);
                    db.collection("files.files").remove({_id:item._id},function(err){
                        cb(err);
                    });
                });
            });
        }else{
            var store = new mongo.GridStore(db,item._id,item.filename,"r",{root:"files"});
            store.open(function(err,gs){
                if(err) return cb(err);
                gs.unlink(function(err){
                    if(err) return cb(err);
                    cb();
                });
            });
        }
    }
}
