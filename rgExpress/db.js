var mongoose=require('mongoose');
var Schema = mongoose.Schema;

var GenomeSchema = new Schema({
        ruleSet:Schema.Types.Mixed,
        numIter:Number,
        angle:Number,
        numSpokes:Number,
        rotSpeed:Number,
        spreadSpeed:Number,
        spreadRange:Number,
        size:Number,
        sizeSpeed:Number,
        sizeRange:Number,
        cColSpeed:Number,
        cColRange:Number,
        lColSpeed:Number,
        lColRange:Number,
        noiseSpeed:Number,
        noiseMag:Number,
        meta:Schema.Types.Mixed
    });
var GenomeModel = mongoose.model('Genome',GenomeSchema);    

var GenePoolSchema = new Schema({
        pool: [{genomeId:{type:Schema.Types.ObjectId,ref:'Genome'}, score:Number}],
        created: {type:Date, default:Date.now()},
        breedTime: {type:Date, default:Date.now()+.1*(60*60*1000)},
        hasBred: {type:Boolean, default:false},
        generation: {type:Number, default:0},
        parentId: {type:Schema.Types.ObjectId,ref:'GenePool',default:null},
        numVotes: {type:Number, default:0}
    });
var GenePoolModel = mongoose.model('GenePool',GenePoolSchema);

module.exports={Genome:GenomeModel,GenePool:GenePoolModel};