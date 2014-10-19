function Page(data){
    this.name = data.name||"Start";
    this.url = data.url||"/";
    this.title = data.title||url;
}

Start.prototype.getData = function(req,cb){
    cb({});
}


module.exports = Start;
