var models=require('./db.js');
var ga=require('./ga.js');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose=require('mongoose');
var exphbs=require('express-handlebars');

var routes = require('./routes/index');

var app = express();


mongoose.connect('mongodb://localhost:27017/stardb');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.handlebars', exphbs({extname: '.handlebars',defaultLayout: 'main',layoutsDir:'../views/layouts',helpers:{rootDir:
function(){
return "https://red-garden-adamkilpatrick.c9.io";    
}}}));
app.set('view engine', '.handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var breedTimer=1*(60*60*1000);
var poolSize=64;
app.post('/api/initPool/',function(req, res) {
    if(req.body.id!=696969)
    {
        res.send("Get fucked");
        return;
    }
    models.GenePool.remove(function(err,num){console.log(num+" pools removed");});
    models.Genome.remove(function(err,num){console.log(num+" genomes removed");});
    var poolVar=[];
    for(var i=0; i<poolSize; i++)
    {
        var randomGene = ga.genomeGen(20);
        var geneSave= new models.Genome(randomGene);
        geneSave.save();
        poolVar.push({genomeId:mongoose.Types.ObjectId(geneSave._id),score:5});
        //poolVar.push({genomeId:mongoose.Types.ObjectId(geneSave._id),score:1});
    }
    var poolSave=new models.GenePool({pool:poolVar,created:Date.now(),breedTime:Date.now()+breedTimer});
    poolSave.save(function (err) {
        if (!err) {
          return console.log("created");
        } else {
          return console.log(err);
        }
    });
    res.send(poolSave);
});

app.post('/api/matchResults',function(req, res) {
    var winnerId=req.body.winner;
    var loserId=req.body.loser;
    var pools = models.GenePool.find().exec(function(err,docs){
        for(var i=0; i<docs[docs.length-1].pool.length; i++)
        {
            if(docs[docs.length-1].pool[i].genomeId.toString()==winnerId)
            {
                docs[docs.length-1].pool[i].score+=1;
            }
            if(docs[docs.length-1].pool[i].genomeId.toString()==loserId)
            {
                if(docs[docs.length-1].pool[i].score>1)
                {
                    docs[docs.length-1].pool[i].score-=1;
                }
            }
        }
        docs[docs.length-1].numVotes+=1;
        docs[docs.length-1].save();
        res.send(docs[docs.length-1]);
    });
});

app.get('/api/getPair',function(req, res) {
    var pair={genome1:null,genome2:null};
    var pools = models.GenePool.findOne({hasBred:false}).populate('pool.genomeId').exec(function(err,docs){
        var i1=Math.floor(Math.random()*docs.pool.length);
        var i2=i1;
        while(i1==i2)
        {
            i2=Math.floor(Math.random()*docs.pool.length);
        }
        pair.genome1=docs.pool[i1].genomeId;
        pair.genome2=docs.pool[i2].genomeId;
        res.send(pair);
    });
});
var legacyAmt=1/16;
app.get('/api/getPoolStats',function(req, res) {
    var pools = models.GenePool.findOne({hasBred:false}).populate('pool.genomeId').exec(function(err,docs){
        var popsize=docs.pool.length;
        if(popsize)
        var sortedPool=docs.toObject().pool.sort(function(g1,g2){return g2.score-g1.score;});
        var legacies=[];
        for(var i=0; i<sortedPool.length*legacyAmt; i++)
        {
            legacies.push({"name":sortedPool[i].genomeId.meta.name,"id":sortedPool[i].genomeId._id,"score":sortedPool[i].score});
        }
        var stats={"genNum":docs.generation,"breedTime":docs.breedTime,"votesLeft":minVotes-docs.numVotes,"legacies":legacies};
        if(stats.votesLeft<0)
        {
            stats.votesLeft=0;
        }
        res.send(stats);
    });    
});
var minVotes=~~(poolSize*.8);
function prepBreedNewPool(){
        setInterval(function() {
            //console.log("CHECKING FOR BREEDS");
            var pools = models.GenePool.findOne({hasBred:false}).populate('pool.genomeId').exec(function(err,docs){
            if(docs!=null&&docs.breedTime<Date.now()&&docs.numVotes>minVotes){
            //console.log(docs.pool);
            var genomes=[];
            var scores=[];
            for(var i=0; i<docs.pool.length; i++)
            {
                genomes.push(docs.pool[i].genomeId);
                scores.push(docs.pool[i].score);
            }
            console.log(genomes[0]);
            var breedRes=ga.breed(genomes,scores);
            
            var poolVar=[];
            var legacies=docs.toObject().pool.sort(function(g1,g2){return g2.score-g1.score;});
            var numLegacies=Math.floor(breedRes.length*legacyAmt);
            for(var i=0; i<numLegacies;i++)
            {
                models.Genome.findByIdAndUpdate(legacies[i].genomeId,{$set:{"meta.legacy":true}});
                poolVar.push({genomeId:legacies[i].genomeId,score:5});
            }
            for(var i=numLegacies; i<breedRes.length; i++)
            {
                var bredGene = breedRes[i];
                var geneSave= new models.Genome(bredGene);
                geneSave.save();
                poolVar.push({genomeId:mongoose.Types.ObjectId(geneSave._id),score:5});
                //poolVar.push({genomeId:mongoose.Types.ObjectId(geneSave._id),score:1});
            }
            var newPool = new models.GenePool({pool:poolVar,generation:docs.generation+1,parentId:mongoose.Types.ObjectId(docs._id),created:Date.now(),breedTime:Date.now()+breedTimer});
            newPool.save();
            docs.hasBred=true;
            docs.save();
            console.log("BREED OCCURED");
            }
        });
    },6000);
}
prepBreedNewPool();
app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
