module.exports={
    genomeGen:function(numMut){return genMutatedGenome(numMut);},
    breed:function(pool,scores){
        
        return breed(pool,scores);}
};

function genome() {
	this.ruleSet=[["0","01[0[01]]00"],["1","11"]];
	this.numIter=3;
	
	this.angle=20;
	this.numSpokes=6;
	this.rotSpeed=.001;
	
	//Speed at which variations in angle in the branches happens, increase for faster "uncurling" of the arms
	this.spreadSpeed=.001;
	this.spreadRange=30;
	
	this.size=.5;
	this.sizeSpeed=.001;
	this.sizeRange=.3;
	
	//overall speed at which color changes, increase for more strobe like effect
	this.cColSpeed=.0008;
	this.cColRange=200;
	//this.cColTarg=.5;
	
	//the color variation as the colors change up the spokes, increase for a more "rainbow-y" effect in the structure
	this.lColSpeed=.0008;
	this.lColRange=100;
	
	//speed at which the particles spread out from the calculated lines of the system
	this.noiseSpeed=.001;
	//amount that the particles spread from the lines
	this.noiseMag=6;
	
	
	//VARIABLES NOT PASSED TO CHILDREN
	this.meta={'name':genName(),"legacy":false};
	
}

function genMutatedGenome(numMuts){
    var outGen=new genome();
    for(var i=0; i<numMuts; i++)
    {
        mutate(outGen);
    }
    return outGen;
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

//some constants for mutation
var ruleMutProb=.3;
var defMutFactor=1.7;
var angles=[10,15,20,30,45,60,90,120,180];
var spokes=[];
for(var i=0; i<angles.length; i++)
{
	spokes.push([]);
	for(var j=2; j*angles[i]<=360; j++)
	{
		if(360%(j*angles[i])==0)
		{
			spokes[i].push(j);
		}
	}	
}
function mutate(inGenome) {
	var key = "ruleSet";
	if(Math.random()>ruleMutProb)
	{
		//The minus one keeps it from hitting the meta key
		key=Object.keys(inGenome)[getRandomInt(0,Object.keys(inGenome).length-1)];
	}
	//console.log(key);
	
	switch(key){
		case "ruleSet":
			inGenome.ruleSet[0][1]=stringifyFract(mutRuleSet(arrayifyFract(inGenome.ruleSet[0][1])));
		break;
		
		case "numIter":
			if(Math.random()>.5)
			{
				inGenome.numIter+=1;
			}
			else
			{
				inGenome.numIter-=1;
			}
		break;
		
		case "angle":
			var tempAng=inGenome.angle;
			inGenome.angle=angles[getRandomInt(0,angles.length)];
			inGenome.spreadRange*=tempAng/inGenome.angle;
		break;
		
		//Numspokes used to be dependent on angle but it should be good to be on its own with new way of cloning a single l-system branch rather than doing axiom magic
		case "numSpokes":
			//inGenome.numSpokes=spokes[angles.indexOf(inGenome.angle)][getRandomInt(0,spokes[angles.indexOf(inGenome.angle)].length)];
			var newSpokes=getRandomInt(0,19);
			while(360%newSpokes!=0)
			{
				newSpokes=getRandomInt(0,19);
			}
			inGenome.numSpokes=newSpokes;
		break;

		default:
			if(Math.random()>.5)
			{
				inGenome[key]*=defMutFactor;
			}
			else
			{
				inGenome[key]/=defMutFactor;
			}
	}
}

function cloneRules(inRules){
	var outRules=[];
	for(var i=0; i<inRules.length; i++)
	{
		if(typeof(inRules[i])=="string")
		{
			outRules.push(inRules[i]);
		}
		else
		{
			outRules.push(cloneRules(inRules[i]));
		}
	}
	return outRules;
}
var subMutProb=.5;
function mutRuleSet(inRules){
	var evoStruct = cloneRules(inRules);
	var mutIndex= getRandomInt(0,evoStruct.length);
	//0 is delete, 1 is insert, 2 is change
	var actionFlag=getRandomInt(0,3);
	//console.log(actionFlag+" - "+mutIndex);
	//console.log(evoStruct);
	//IF THE STRUCT IS EMPTY INSERT MUST BE DONE
	if(evoStruct.length==0)
	{
		evoStruct.push("0");
		return evoStruct;
	}
	//branch mutation
	if(typeof(evoStruct[mutIndex])!="string"&&Math.random()<subMutProb)
	{
		//console.log("BRANCH MUT");
		evoStruct[mutIndex]=mutRuleSet(cloneRules(evoStruct[mutIndex]));
		return evoStruct;
	}
	
	//DELETE MUTATION
	if(actionFlag==0)
	{
		evoStruct.splice(mutIndex,1);
	}
	
	//INSERT MUTATION
	if(actionFlag==1)
	{
		var insTypes=["0","1",[]];
		var insType=insTypes[getRandomInt(0,insTypes.length)];
		evoStruct.splice(mutIndex,0,insType);
	}
	
	//CHANGE MUTATION
	if(actionFlag==2)
	{
		var insTypes=["0","1",[]];
		var insType=insTypes[getRandomInt(0,insTypes.length)];
		
		evoStruct[mutIndex]=insType;
	}
	
	return evoStruct;
}

function arrayifyFract(stringStruct)
{
	//console.log(stringStruct);
	var outArray=[];
	var sem=0;
	var branchString="";
	for(var i=0; i<stringStruct.length; i++)
	{
		if(stringStruct[i]=="[")
		{
			sem++;
			if(sem!=1)
			{
				branchString+="[";
			}
		}
		else if(stringStruct[i]=="]")
		{
			sem--;
			if(sem==0)
			{
				outArray.push(arrayifyFract(branchString));
				branchString="";
			}
			else
			{
				branchString+="]";
			}
		}
		else if(sem==0)
		{
			outArray.push(stringStruct[i]);
		}
		else
		{
			branchString+=stringStruct[i];
		}
	}
	return outArray;
}

function stringifyFract(arrayStruct){
	var outString="";
	for(var i=0; i<arrayStruct.length; i++)
	{
		if(typeof(arrayStruct[i])=="string")
		{
			outString+=arrayStruct[i];
		}
		else
		{
			outString+="["+stringifyFract(arrayStruct[i])+"]";
		}
	}
	return outString;
}

var crossChance=.7;
var ruleCrossChance=0;
function crossover(genome1,genome2){
	var children=[new genome(), new genome()];
	
	//minus one again to keep out of meta data
	for(var i=0; i<Object.keys(children[0]).length-1; i++)
	{
		var curKey = Object.keys(children[0])[i];
		if(Math.random()<crossChance)
		{
			children[0][curKey]=genome2[curKey];
			children[1][curKey]=genome1[curKey];
		}
		else
		{
			children[1][curKey]=genome2[curKey];
			children[0][curKey]=genome1[curKey];
		}
	}
	//If the angles and spokes get swapped there is possibility for geometric failure, fix it if case happens (ACTUALLY WAIT NO SPACING IS ONLY BASED ON NUMSPOKES NOW)
	
	//deepcopy the rules to be safe
	children[0]["ruleSet"]=cloneRules(children[0]["ruleSet"]);
	children[1]["ruleSet"]=cloneRules(children[1]["ruleSet"]);
	
	//seperate crossover for specifically the rules, the more I think about this the less sense it makes, probably should leave this domain to mutations maybe?
	if(Math.random()<ruleCrossChance)
	{
		var ruleCross=crossoverRules(arrayifyFract(cloneRules(genome1.ruleSet[0][1])),arrayifyFract(cloneRules(genome2.ruleSet[0][1])));
		children[0]["ruleSet"][0][1]=stringifyFract(ruleCross[0]);
		children[1]["ruleSet"][0][1]=stringifyFract(ruleCross[1]);
	}
	return children;
}

function crossoverRules(rule1,rule2){
	var minLen=Math.min(rule1.length,rule2.length);
	var maxLen=Math.max(rule1.length,rule2.length);
	var outArrays=[[],[]];
	for(var i=0; i<minLen; i++)
	{
		//check for aligning sub branches
		if(typeof(rule1[i])!="string"&&typeof(rule2[i])!="string")
		{
			var subCross=crossoverRules(rule1[i],rule2[i]);
			outArrays[0].push(subCross[0]);
			outArrays[1].push(subCross[1]);
		}
		else if(Math.random<crossChance)
		{
			outArrays[0].push(rule1[i]);
			outArrays[1].push(rule2[i]);
		}
		else
		{
			outArrays[1].push(rule1[i]);
			outArrays[0].push(rule2[i]);
		}
	}
	var tailOut=getRandomInt(0,2);
	for(var i=minLen; i<maxLen; i++)
	{
		if(rule1[minLen]==undefined)
		{
			outArrays[tailOut].push(rule2[i]);
		}
		else
		{
			outArrays[tailOut].push(rule1[i]);
		}
	}
	
	return outArrays;
}

var mutProb=.3;
function breed(inPop,scores){
	var outPop=[];
	
	var totScore=0;
	for(var i=0; i<scores.length; i++)
	{
		totScore+=scores[i];
	}
	//Partition the wheel
	var roulette=[];
	for(var i=0; i<scores.length; i++)
	{
		if(i==0)
		{
			roulette.push(scores[i]/totScore);
		}
		else
		{
			roulette.push(scores[i]/totScore+roulette[i-1]);
		}
	}
	
	//Main breeding loop
	for(var k=0; k<inPop.length/2; k++)
	{
		//Select first mate
		var mate1=-1;
		var roll=Math.random();
		for(var i=0; i<roulette.length; i++)
		{
			if(roll<roulette[i])
			{
				mate1=i;
				break;
			}
		}
		
		//choose second mate
		var mate2=mate1;
		while(mate2==mate1)
		{
			roll=Math.random();
			for(var i=0; i<roulette.length; i++)
			{
				if(roll<roulette[i])
				{
					mate2=i;
					break;
				}
			}
		}
		
		//console.log("MATES: "+mate1+" - "+mate2);
		//crossover the mates and push children into output
		var children = crossover(inPop[mate1],inPop[mate2]);
		//DO MUTATUION
		if(Math.random()<mutProb)
		{
			mutate(children[0]);
		}
		if(Math.random()<mutProb)
		{
			mutate(children[1]);
		}
		outPop.push(children[0]);
		outPop.push(children[1]);
		//console.log(children[0].ruleSet);
		//console.log(children[1].ruleSet);
	}
	
	return outPop;
}

//NAME STUFF
function genName(){
	var i1=getRandomInt(0,firstName.length);
	var i2=getRandomInt(0,secondName.length);
	return firstName[i1]+" "+secondName[i2];
}
var secondName=[
"Rose",
"Daisy",
"Lily",
"Amaryllis",
"Anemone",
"Anthurium",
"Aster",
"Carnation",
"Daisy",
"Coxcomb",
"Daffodil",
"Dahlia",
"Delphinium",
"Freesia",
"Gardenia",
"Gerbera",
"Gladiolus",
"Heliconia",
"Hyacinth",
"Hydrangea",
"Hypercium",
"Iris",
"Larkspur",
"Liatris",
"Limonium",
"Lisanthus",
"Orchid",
"Peony",
"Poinsettia",
"Protea",
"Tulip",
"Statice",
"Amaryllis",
"Amaranth",
"Aster",
"Azalea",
"Bergamot",
"Carnation",
"Camellias",
"Blossom",
"Chrysantemum",
"Clover",
"Crocus",
"Foxglove",
"Jasmine",
"Lilac",
"Lotus",
"Marigold",
"Thistle",
"Violet",
"Zinnia",
"Abelia","Abeliophyllum","Abelmoschus","Abies","Abroma","Abromeitiella","Abrus","Abutilon","Acacia","Acaena","Acalypha","Acantholimon","Acanthophoenix","Feijoa","Maple","Achillea","Achimenes","Acinos","Aciphylla","Acmena","Acoelorraphe","Acokanthera","Aconitum","Acorus","Acradenia","Acrocomia","Actinidia","Adansonia","Adenandra","Adenanthos","Adenia","Adenium","Adenocarpus","Adenophora","Adenostoma","Adiantum","Adlumia","Adromischus","Aechmea","Aegopodium","Aeonium","Aerangis","Aerides","Aeschynanthus","Aesculus","Aethionema","Afgekia","Agapanthus","Agapetes","Agastache","Agathis","Agathosma","Agave","Ageratum","Aglaia","Aglaonema","Agonis","Agrimonia","Agrostemma","Agrostis","Aichryson","Ailanthus","Aiphanes","Aira","Ajania","Ajuga","Akebia","Alangium","Rubiaceae","Albizia","Albuca","Alcea","Alchemilla","Aldrovanda","Aleurites","Aliceara","Alisma","Alkanna","Allagoptera","Allamanda","Allium","Allocasuarina","Allosyncarpia","Alloxylon","Alluaudia","Alnus","Alocasia","Aloe","Aloinopsis","Alonsoa","Alopecurus","Aloysia","Alphitonia","Alpinia","Alsobia","Alstonia","Alstroemeria","Alternanthera","Alyogyne","Alyssum","Alyxia","Amaranthus","Amarcrinum","Amaryllis","Amberboa","Amelanchier","Amesiella","Amherstia","Amicia","Ammobium","Amorpha","Amorphophallus","Ampelopsis","Amsonia","Anacampseros","Anacardium","Anacyclus","Anagallis","Ananas","Anaphalis","Anchusa","Andira","Androlepis","Andropogon","Androsace","Anemia","Anemone","Anemonella","Anemonopsis","Anemopaegma","Anethum","Angelica","Angelonia","Angiopteris","Angophora","Angraecum","Anguloa","Anigozanthos","Anisacanthus","Anisodontea","Annona","Anoda","Anomatheca","Freesia","Anopterus","Anredera","Antennaria","Anthemis","Anthericum","Anthocleista","Anthotroche","Anthriscus","Anthurium","Anthyllis","Antidesma","Antigonon","Antirrhinum","Apera","Aphelandra","Aphyllanthes","Apium","Apocynum","Aponogeton","Apophyllum","Apodytes","Aponogeton","Aporocactus","Aprevalia","Aptenia","Aquilegia","Arabis","Arachis","Arachniodes","Araeococcus","Araiostegia","Aralia","Araucaria","Araujia","Arbutus","Archidendron","Archontophoenix","Arctium","Arctostaphylos","Arctotheca","Arctotis","Ardisia","Areca","Arenga","Argemone","Argyranthemum","Argyreia","Argyroderma","Ariocarpus","Arisaema","Arisarum","Aristea","Aristolochia","Armeria","Arnebia","Arnica","Aronia","Saritaea","Arrhenatherum","Artanema","Artabotrys","Arthrocereus","Arthropodium","Artocarpus","Arum","Aruncus","Arundina","Arundinaria","Arundo","Asarina","Asarum","Asclepias","Ascocenda","Ascocentrum","Asimina","Asparagus","Asperula","Asphodeline","Asphodelus","Aspidistra","Asplenium","Astelia","Asteranthera","Astilbe","Astilboides","Astragalus","Astrantia","Astrophytum","Asystasia","Athamanta","Atherosperma","Athrotaxis","Athyrium","Atriplex","Aubrieta","Aucuba","Aulax","Auranticarpa","Aurinia","Austrocedrus","Austrocylindropuntia","Austrostipa","Averrhoa","Avicennia","Azadirachta","Azalea","Azolla","Azorella","Azorina","Aztekium","Babiana","Baccharis","Backhousia","Bacopa","Bactris","Baeckea","Baikiaea","Ballota","Balsamorhiza","Bambusa","Banksia","Baptisia","Barbarea","Barkeria","Barleria","Barklya","Barnadesia","Barringtonia","Bartlettina","Basselinia","Bassia","Bauera","Bauhinia","Baumea","Beallara","Beaucarnea","Beaumontia","Beccariella","Bedfordia","Begonia","Belamcanda","Bellevalia","Bellis","Bellium","Berberidopsis","Berberis","Berchemia","Bergenia","Bergerocactus","Berkheya","Berlandiera","Berrya","Bertolonia","Berzelia","Beschorneria","Bessera","Betula","Biarum","Bidens","Bignonia","Bikkia","Billardiera","Billbergia","Bischofia","Bismarckia","Bixa","Blandfordia","Blechnum","Bletilla","Blighia","Bloomeria","Blossfeldia","Bocconia","Boenninghausenia","Bolax","Bolbitis","Bollea","Boltonia","Bolusanthus","Bomarea","Bombax","Bongardia","Boophone","Borago","Borassodendron","Borassus","Boronia","Bossiaea","Bothriochloa","Bougainvillea","Bouteloua","Bouvardia","Bowenia","Bowiea","Bowkeria","Boykinia","Brabejum","Brachychiton","Brachyglottis","Brachylaena","Brachypodium","Brachyscome","Brachysema","Brachystelma","Bracteantha","Brahea","Brassavola","Brassaia","Brassia","Brassica","Brassidium","Brassocattleya","Brassolaeliocattleya","Breynia","Briggsia","Brillantaisia","Brimeura","Briza","Brodiaea","Bromelia","Broughtonia","Broussonetia","Browallia","Brownea","Browningia","Bruckenthalia","Brugmansia","Brunfelsia","Brunnera","Brunsvigia","Brya","Buckinghamia","Buddleja","Buglossoides","Bulbine","Bulbinella","Bulbocodium","Bulbophyllum","Bulnesia","Bunchosia","Buphthalmum","Bupleurum","Burchardia","Burchellia","Burrageara","Burretiokentia","Bursaria","Bursera","Burtonia","Butea","Butia","Butomus","Buxus","Byrsonima","Bystropogon","Cabomba","Cadia","Caesalpinia","Caladium","Calamagrostis","Calamintha","Calandrinia","Calanthe","Calathea","Calceolaria","Calendula","Calibanus","Calibrachoa","Calla","Calliandra","Callianthemum","Callicarpa","Callicoma","Callisia","Callistemon","Callistephus","Callitriche","Callitris","Calluna","Calocedrus","Calochone","Calochortus","Calodendrum","Calomeria","Calophaca","Calophyllum","Calopyxis","Caloscordum","Calothamnus","Calotropis","Caltha","Calycanthus","Calymmanthium","Calypso bulbosa","Calytrix","Camassia","Camellia","Campanula","Campsis","Campylotropsis","Lespedeza","Cananga","Canarina","Canistrum","Cantua","Capparis","Capsicum","Caragana","Caralluma","Cardamine","Cardiocrinum","Cardiospermum","Cardwellia","Carex","Carissa","Carlina","Carludovica","Carmichaelia","Carnegiea","Carpentaria","Carpenteria","Carphalea","Carpinus","Carpobrotus","Carthamus","Carum","Carya","Caryopteris","Caryota","Cassinia","Cassiope","Cassipourea","Chestnut","Castanopsis","Castanospermum","Casuarina","Catalpa","Catananche","Catasetum","Khat","Catharanthus","Catopsis","Cattleya","Caulophyllum","Cautleya","Cavendishia","Ceanothus","Cedrela","Cedronella","Cedrus","Ceiba","Celastrus","Celmisia","Celosia","Celtis","Centaurea",
"Centaurium","Centradenia","Centranthus","Cephalaria","Cephalocereus","Cephalophyllum","Cephalotaxus","Ceraria","Cerastium","Ceratonia","Ceratopetalum","Ceratophyllum","Ceratopteris","Ceratostigma","Ceratozamia","Cerbera","Cercidiphyllum","Cercis","Cercocarpus","Ceropegia","Cestrum","Chadsia","Chaenomeles","Chaenorhinum","Chaerophyllum","Chamaecyparis","Chamaecytisus","Chamaedaphne","Chamaedorea","Chamaelirium","Chamaemelum","Chamaerops","Chamelaucium","Chasmanthe","Chasmanthium","Cheilanthes","Cheiridopsis","Chelidonium","Chiastophyllum","Chiliotrichum","Chilopsis","Chimaphila","Chimonanthus","Chimonobambusa","Chionanthus","Chionochloa","Chionodoxa","Chionoscilla","Chirita","Chlidanthus","Choisya","Chonemorpha","Choricarpia","Chorisia","Chorizema","Chrysalidocarpus","Chrysanthemoides","Chrysanthemum","Chrysobalanus","Chrysogonum","Chrysolepis","Chrysolepis","Chrysophyllum","Chrysothemis","Chusquea","Cibotium","Cicerbita","Cichorium","Cimicifuga","Cinnamomum","Cionura","Cirsium","Cissus","Cistus","Citharexylum","Citrofortunella","Citrus","Cladanthus","Cladrastis","Clarkia","Claytonia","Cleistocactus","Clematis","Cleome","Clerodendrum","Clethra","Cleyera","Clianthus","Clintonia","Clitoria","Clivia","Clusia","Clytostoma","Cobaea","Coccoloba","Coccothrinax","Cocculus","Cochlioda","Cochlospermum","Codiaeum","Codonanthe","Codonopsis","Coelia","Coelogyne","Coffea","Coix","Colchicum","Coleonema","Colletia","Collinsia","Collomia","Colocasia","Colquhounia","Columnea","Colutea","Coluteocarpus","Colvillea","Combretum","Comesperma","Commelina","Commersonia","Commidendrum","Commiphora","Comptonia","Conandron","Congea","Conicosia","Coniogramme","Conoclinium","Conophytum","Conospermum","Conostylis","Conradina","Consolida","Convallaria","Convolvulus","Copernicia","Copiapoa","Pilocopiapoa","Coprosma","Coptis","Cordia","Cordyline","Coreopsis","Coriandrum","Coriaria","Dogwood","Corokia","Coronilla","Corryocactus","Cortaderia","Cortusa","Corydalis","Corylopsis","Corylus","Corymbia","Corynocarpus","Corypha","Coryphantha","Costus","Cotinus","Cotoneaster","Cotula","Cotyledon","Couroupita","Crambe","Craspedia","Crassula","+Crataegomespilus","Crataegus","Crataemespilus","Crepis","Crescentia","Crinodendron","Crinum","Crocosmia","Crocus","Crossandra","Crotalaria","Crowea","Cryptanthus","Cryptocarya","Water trumpet","Sugi","Cryptostegia","Cryptotaenia","Ctenanthe","Cucumis","Cucurbita","Cuminum","Cunila","Cunninghamia","Cunonia","Cupaniopsis","Cuphea","Cupressus","Curcuma","Cussonia","Cyananthus","Cyanotis","Cyathea","Cyathodes","Cybistax","Cycas","Cyclamen","Cycnoches","Cydista","Quince","Cylindropuntia","Cymbalaria","Cymbidium","Cymbopogon","Cynara","Cynodon","Cynoglossum","Cypella","Cyperus","Cyphomandra","Cyphostemma","Cypripedium","Cyrilla","Cyrtanthus","Cyrtomium","Cyrtostachys","Cystopteris","Cytisus","Daboecia","Dacrydium","Dactylis","Dactylorhiza","Dahlia","Dalea","Dalechampia","Damasonium","Dampiera","Daphniphyllum","Darlingia","Darmera","Peltiphyllum","Dasylirion","Datura","Davallia","Daviesia","Decaisnea","Degarmoara","Decumaria","Deinanthe","Delairea","Delonix","Delosperma","Delphinium","Dendranthema","Dendrobium","Dendrocalamus","Dendrochilum","Dendromecon","Denmoza","Dennstaedtia","Deppea","Derris","Derwentia","Deschampsia","Desfontainia","Desmodium","Deuterocohnia","Abromeitiella","Deutzia","Dianthus","Dicentra","Dichelostemma","Dichondra","Dichorisandra","Dichroa","Dicksonia","Dicliptera","Dictamnus","Dictyosperma","Didymochlaena","Dieffenbachia","Dierama","Diervilla","Dietes","Digitalis","Dillenia","Dillwynia","Dimorphotheca","Dioon","Dioscorea","Rajania","Tamus","Testudinaria","Diospyros","Dipcadi","Dipelta","Diphylleia","Diplarrhena","Diplazium","Diplocyclos","Diploglottis","Diplolaena","Dipsacus","Dipteronia","Dipteryx","Dirca","Disanthus","Discaria","Dischidia","Discocactus","Disocactus","Disporopsis","Disporum","Dissotis","Distictis","Distylium","Dizygotheca","Docynia","Dodecatheon","Dodonaea","Dolichandrone","Dombeya","Doodia","Doronicum","Dorstenia","Doryanthes","Doryopteris","Dovyalis","Draba","Dracocephalum","Dracophyllum","Dregea","Drimys","Drosanthemum","Drosera","Dryandra","Drynaria","Dryopteris","Duboisia","Duchesnea","Dudleya","Duranta","Duvalia","Dyckia","Dymondia","Dypsis","Chrysalidocarpus","Neodypsis","Ecballium","Eccremocarpus","Echeveria","Echidnopsis","Echinacea","Echinocactus","Echinocereus","Echinops","Echinopsis","Echium","Edgeworthia","Edithcolea","Edraianthus","Ehretia","Eichhornia","Elaeagnus","Elaeis","Elaeocarpus","Elatostema","Eleocharis","Elettaria","Eleutherococcus","Elodea","Elsholtzia","Embothrium","Emmenopterys","Encelia","Encephalartos","Encyclia","Enkianthus","Ensete","Eomecon","Epacris","Epidendrum","Epigaea","Epilobium","Epimedium","Epipactis","Epiphyllum","Episcia","Epithelantha","Equisetum","Eragrostis","Eranthemum","Eranthis","Eremurus","Erica","Erigeron","Erinacea","Erinus","Eriobotrya","Eriogonum","Eriophorum","Eriophyllum","Eriostemon","Eritrichium","Erodium","Eryngium","Erysimum","Erythrina","Erythronium","Escallonia","Eschscholzia","Escobaria","Espostoa","Etlingera","Eucalyptus","Eucomis","Eucommia","Eucryphia","Eulophia","Euonymus","Eupatorium","Euphorbia","Euptelea","Eurya","Euryale","Euryops","Eustoma","Evolvulus","Exacum","Exochorda","Beech","Fallopia","Farfugium","Fargesia","Fascicularia","Fatshedera lizei","Fatsia","Faucaria","Fendlera","Fenestraria","Ferocactus","Ferraria","Ferula","Festuca","Fibigia","Ficus","Ficus pumila","Filipendula","Firmiana","Fittonia","Fitzroya","Fockea","Foeniculum","Fontanesia","Forsythia","Kumquat","Fothergilla","Fouquieria","Fragaria","Frailea","Francoa","Frangipani","Franklinia","Fraxinus","Freesia","Fremontodendron","Fritillaria","Fuchsia","Furcraea","Gagea","Gaillardia","Galanthus","Galega","Galium","Galtonia","Gardenia","Garrya","Gasteria","Gaultheria","Gaura","Gaylussacia","Gazania","Geissorhiza","Gelsemium","Genista","Gentiana","Gentianopsis","Geranium","Gerbera","Gesneria","Gevuina","Gibbaeum","Gilia","Gillenia","Ginkgo biloba","Gladiolus","Glaucium","Gleditsia","Globba","Globularia","Glottiphyllum","Glyceria",
"Glycyrrhiza","Gomphocarpus","Gomphrena","Goodyera","Graptopetalum","Graptophyllum","Grevillea","Grewia","Greyia","Grindelia","Gunnera","Guzmania","Gymnocalycium","Gymnocarpium","Gymnocladus","Gynandriris","Gynura","Gypsophila","Haageocereus","Haastia","Habenaria","Haberlea","Habranthus","Hacquetia","Haemanthus","Hakea","Hakonechloa","Halesia","Halimium","Halimodendron","Hamamelis","Haplopappus","Hardenbergia","Hatiora","Haworthia","Hechtia","Hedera","Hedychium","Hedyotis","Hedysarum","Hedyscepe","Helenium","Helianthemum","Helianthus","Helichrysum","Heliconia","Helictotrichon","Heliocereus","Heliophila","Heliopsis","Heliotropium","Helleborus","Heloniopsis","Hemerocallis","Hemigraphis","Hepatica","Heptacodium","Hermannia","Hermodactylus","Hesperaloe","Hesperantha","Hesperis","Hesperocallis","Heterotheca","Heuchera","Heucherella","Hibbertia","Hibiscus","Hieracium","Himalayacalamus","Hippeastrum","Hippocrepis","Hippophae","Hohenbergia","Hohenbergiopsis","Hoheria","Holboellia","Holcus","Holmskioldia","Holodiscus","Homalocladium","Homeria","Hoodia","Hordeum","Horminum","Hosta","Hottonia","Houttuynia","Hovea","Hovenia","Howea","Hoya","Huernia","Humulus","Huntleya","Hyacinthella","Hyacinthoides","Hydrangea","Hydrastis","Hydrocharis","Hydrocleys","Hydrocotyle","Hylocereus","Hylomecon","Hymenocallis","Hymenosporum","Hyophorbe","Hyoscyamus","Hypericum","Hyphaene","Hypocalymma","Hypoestes","Hypoxis","Hypsela","Iberis","Idesia polycarpa","Ilex","Illicium","Impatiens","Imperata","Incarvillea","Indigofera","Inula","Iochroma","Ipheion","Ipomoea","Ipomopsis","Iresine","Isatis","Isoplexis","Isopyrum","Ixia","Ixiolirion","Ixora","Jaborosa","Jacaranda","Jamesia","Jasione","Jasminum","Jatropha","Jeffersonia","Jovibarba","Jubaea","Walnut","Juncus","Juniperus","Justicia","Kadsura","Kaempferia","Kalanchoe","Kalimeris","Kalmia","Kalmiopsis","Kalopanax","Kigelia","Kirengeshoma","Kleinia","Knautia","Kniphofia","Koeleria","Koelreuteria","Kohleria","Kolkwitzia","Kosteletzkya","Kunzea","Lablab","Laburnocytisus","Laburnum","Laccospadix","Lachenalia","Laelia","Laeliocattleya","Lagarosiphon","Lagerstroemia","Lagunaria","Lamarckia","Lambertia","Lamium","Lampranthus","Lantana","Lapageria","Lardizabala","Larix","Larrea","Latania","Lathraea","Lathyrus","Laurelia","Laurus","Lavandula","Lavatera","Layia","Ledebouria","Ledum","Leea","Legousia","Leiophyllum","Leitneria","Lemboglossum","Lenophyllum","Leonotis","Leontice","Leontopodium","Lepidozamia","Leptinella","Lechenaultia","Lespedeza","Leucadendron","Leucanthemella","Leucanthemopsis","Leucanthemum","Leuchtenbergia","Leucocoryne","Leucogenes","Leucojum","Leucophyllum","Leucophyta","Leucopogon","Leucospermum","Lewisia","Leycesteria","Leymus","Liatris","Libertia","Libocedrus","Ligularia","Ligustrum","Lilium","Limnanthes","Limnocharis","Limonium","Linanthus","Linaria","Lindera","Linnaea","Linospadix","Linum","Liquidambar","Liriodendron","Lithocarpus","Lithodora","Lithophragma","Lithops","Littonia","Livistona","Loasa","Lobelia","Lobularia","Lodoicea","Lomandra","Lomatia","Lomatium","Lomatophyllum","Lonicera","Lophomyrtus","Lophospermum","Lophostemon","Loropetalum","Luculia","Lunaria","Lupinus","Luzula","Lycaste","Lychnis","Lycium","Lycopodium","Lygodium","Lyonothamnus","Lysichiton","Lysiloma","Lysimachia","Lythrum","Maackia","Machaeranthera","Macleania","Macleaya","Maclura","Macropidia","Macrozamia","Magnolia","Mahonia","Maianthemum","Maihuenia","Malcolmia","Malephora","Malope","Malpighia","Malus","Malva","Malvaviscus","Mandevilla","Mandragora","Manettia","Manglietia","Margyricarpus","Marrubium","Marsilea","Masdevallia","Matteuccia","Matthiola","Maurandella","Maurandya","Maxillaria","Maytenus","Mazus","Meconopsis","Medicago","Medinilla","Meehania","Megaskepasma","Melaleuca","Melasphaerula","Melastoma","Chinaberry","Melianthus","Melica","Melicytus","Melinis","Meliosma","Melittis","Melocactus","Menispermum","Mentha","Mentzelia","Menyanthes","Menziesia","Merendera","Merremia","Mertensia","Mespilus","Metasequoia","Metrosideros","Mexicoa","Michauxia","Michelia","Microcachrys","Microlepia","Micromeria","Mikania","Milla","Millettia","Miltonia","Miltoniopsis","Mimetes","Mimosa","Mimulus","Miscanthus","Mitchella","Mitella","Mitraria","Molinia","Moluccella","Monadenium","Monanthes","Monarda","Monardella","Monstera","Moraea","Morina","Morisia","Mucuna","Muehlenbeckia","Mukdenia","Muscari","Mussaenda","Mutisia","Myoporum","Myosotidium","Myosotis","Myrica","Myriophyllum","Myrrhis","Myrsine","Myrteola","Myrtillocactus","Myrtus","Nandina","Nautilocalyx","Neillia","Nelumbo","Nematanthus","Nemopanthus","Nemophila","Neobuxbaumia","Neolitsea","Neolloydia","Neomarica","Eriosyce","Neoregelia","Nepenthes","Nepeta","Nephrolepis","Nerine","Nerium","Nertera","Nicandra","Nicotiana","Nidularium","Nierembergia","Nigella","Nipponanthemum","Nolana","Nomocharis","Nopalxochia","Nothofagus","Notholirion","Nothoscordum","Notospartium","Nuphar","Nymania","Nymphaea","Nymphoides","Tupelo","Obregonia","Ochagavia","Ochna","Ocimum","Odontocidium","Odontoglossum","Odontonema","Odontonia","Oemleria","Oenothera","Olea","Olearia","Olneya","Olsynium","Omphalodes","Oncidium","Onoclea","Ononis","Onopordum","Onosma","Oophytum","Ophiopogon","Ophrys","Oplismenus","Opuntia","Orbeopsis","Orchis","Oreocereus","Origanum","Ornithogalum","Orontium","Orostachys","Oroya","Ortegocactus","Orthophytum","Orthrosanthus","Oryza","Osbeckia","Osmanthus","Osmunda","Osteomeles","Osteospermum","Ostrowskia","Ostrya","Othonna","Oxalis","Oxydendrum","Oxypetalum","Ozothamnus","Pachistima","Pachycereus","Pachycymbium","Pachyphytum","Pachypodium","Pachysandra","Pachystachys","Pachystegia","Pachystima","Peony","Paliurus","Pamianthe","Panax","Pandanus","Pandorea","Panicum","Pansy","Papaver","Paphiopedilum","Paradisea","Parkinsonia","Parnassia","Parochetus","Parodia","Parrotia","Parrotiopsis","Parthenocissus","Passiflora","Patersonia","Patrinia","Paulownia","Paurotis palm","Pedilanthus","Pediocactus","Pelargonium","Pellaea","Peltandra","Peltophorum",
"Peniocereus","Pennisetum","Penstemon","Pentaglottis","Pentas","Peperomia","Peraphyllum","Pereskia","Pericallis","Perilla","Perovskia","Gaultheria","Persea","Persicaria","Petasites","Petrea","Petrocosmea","Petrophile","Petrophyton","Petrophytum","Petrorhagia","Petroselinum","Petteria","Petunia","Phacelia","Phaedranassa","Phaius","Phalaenopsis","Phalaris","Phebalium","Phegopteris","Phellodendron","Philadelphus","Philesia","Phillyrea","Philodendron","Phlebodium","Phlomis","Phlox","Phormium","Photinia","Phragmipedium","Phragmites","Phygelius","Phylica","Phyllocladus","Phyllostachys","Physalis","Physaria","Physocarpus","Physoplexis","Physostegia","Phyteuma","Phytolacca","Picea","Picrasma","Pilea","Pileostegia","Pilosocereus","Pimelea","Pimpinella","Pinanga","Pinellia","Pinguicula","Pinus","Piptanthus","Pisonia","Pistacia","Pistia","Pitcairnia","Pithecellobium","Pittosporum","Plantago","Platanus","Platycarya","Platycerium","Platycladus","Platycodon","Platystemon","Plectranthus","Pleioblastus","Pleiospilos","Pleurothallis","Plumeria","Poa","Podalyria","Podocarpus","Podophyllum","Podranea","Polemonium","Polianthes","Polygala","Polygonatum","Polygonum","Polypodium","Polyscias","Polystichum","Poncirus","Pongamia","Pontederia","Poplar","Portea","Portulaca","Portulacaria","Potamogeton","Potentilla","Potinara","Pratia","Primula","Prinsepia","Pritchardia","Promenaea","Prosopis","Prostanthera","Protea","Prumnopitys","Prunus","Pseuderanthemum","Pseudocydonia","Pseudolarix","Pseudopanax","Pseudosasa","Pseudotsuga","Pseudowintera","Psilotum","Psychopsis","Ptelea","Pteris","Pterocactus","Pterocarya","Pterocephalus","Pteropogon","Pterostyrax","Ptilotus","Ptychosperma","Pueraria","Pulmonaria","Pulsatilla","Pultenaea","Punica","Purshia","Puschkinia","Putoria","Pycnanthemum","Pycnostachys","Pyracantha","Pyrola","Pyrrosia","Pyrus","Quaqua","Quercus","Quesnelia","Quisqualis","Ranunculus","Raoulia","Ratibida","Ravenala","Rebutia","Rehderodendron","Rehmannia","Reinwardtia","Retama","Rhaphidophora","Rhaphiolepis","Rhapidophyllum","Rhapis","Rhexia","Rhipsalis","Rhodanthe","Rhodanthemum","Rhodiola","Rhodochiton","Rhododendron","Rhodohypoxis","Rhodophiala","Rhodotypos","Rhoeo","Rhoicissus","Rhus","Rhynchostylis","Ribes","Richea","Ricinus","Rigidella","Robinia","Rochea","Rodgersia","Rodriguezia","Rohdea","Romanzoffia","Matilija poppy","Romulea","Roscoea","Rosmarinus","Rossioglossum","Rothmannia","Roystonea","Rubus","Rudbeckia","Ruellia","Rumex","Rumohra","Ruschia","Ruscus","Russelia","Ruta","Sabal","Saccharum","Sadleria","Sagina","Sagittaria","Saintpaulia","Salix","Salpiglossis","Salvia","Salvinia","Sambucus","Sanchezia","Sandersonia","Sanguinaria","Sanguisorba","Sansevieria","Santolina","Sanvitalia","Sapindus","Sapium","Saponaria","Sarcocapnos","Sarcococca","Saritaea","Sarracenia","Sassafras","Satureja","Sauromatum","Saxegothaea","Saxifraga","Scabiosa","Scadoxus","Schefflera","Schima","Schinus","Schisandra","Schizachyrium","Schizanthus","Schizopetalon","Schizophragma","Schizostylis","Schlumbergera","Schoenoplectus","Schomburgkia","Schotia","Schwantesia","Sciadopitys","Scilla","Scindapsus","Sclerocactus","Scopolia","Scrophularia","Scutellaria","Securinega","Sedum","Selaginella","Selago","Selenicereus","Selinum","Semele","Semiarundinaria","Sempervivum","Senecio","Sequoiadendron","Seriphidium","Serissa","Serruria","Sesbania","Sesleria","Setaria","Shepherdia","Shibataea","Shortia","Sidalcea","Sideritis","Silene","Silphium","Silybum","Simmondsia","Sinningia","Sinofranchetia","Sinojackia","Sinowilsonia","Sisyrinchium","Skimmia","Smilacina","Smilax","Smyrnium","Sobralia","Solandra","Solanum","Soldanella","Soleirolia","Solenostemon","Solidago","Solidago","Sollya","Sophora","Sophrolaeliocattleya","Sophronitis","Sorbaria","Sorbus","Sorghastrum","Sparaxis","Sparganium","Spartina","Spartium","Spathiphyllum","Spathodea","Sphaeralcea","Spigelia","Spiraea","Sporobolus","Sprekelia","Stachys","Stachyurus","Stangeria","Stanhopea","Stapelia","Stapelianthus","Staphylea","Stauntonia","Stenanthium","Stenocactus","Stenocarpus","Stenocereus","Stenomesson","Stephanandra","Stephanocereus","Stephanotis","Sternbergia","Stigmaphyllon","Stipa","Stratiotes","Strelitzia","Streptocarpus","Streptosolen","Strobilanthes","Stromanthe","Strombocactus","Strongylodon","Stewartia","Triggerplant","Stylophorum","Styphelia","Styrax","Succisa","Sulcorebutia","Sutera","Sutherlandia","Swainsona","Swainsonia","Syagrus","Symphoricarpos","Symphyandra","Symphytum","Symplocos","Synadenium","Syneilesis","Syngonium","Syringa","Syzygium","Tabebuia","Tabernaemontana","Tacca","Tagetes","Talinum","Tamarix","Tanacetum","Taxodium","Taxus","Tecomanthe","Tecomaria","Tecophilaea","Telekia","Tellima","Templetonia","Ternstroemia","Tetracentron","Tetradium","Tetraneuris","Tetrapanax","Tetrastigma","Tetratheca","Teucrium","Thalictrum","Thelesperma","Thelocactus","Thelypteris","Thermopsis","Thespesia","Thevetia","Thlaspi","Thrinax","Thryptomene","Thuja","Thujopsis","Thunbergia","Thymophylla","Thyme","Tiarella","Tibouchina","Tigridia","Tilia","Tillandsia","Tipuana","Titanopsis","Tithonia","Todea","Tolmiea","Tolpis","Toona","Torenia","Torreya","Townsendia","Trachelospermum","Trachycarpus","Trachymene","Tradescantia","Trapa","Trichodiadema","Trichosanthes","Tricyrtis","Trientalis","Trifolium","Trillium","Tripterygium","Triteleia","Trochodendron","Trollius","Tropaeolum","Tsuga","Tuberaria","Tulbaghia","Tulipa","Tweedia","Tylecodon","Typha","Uebelmannia","Ugni","Ulex","Ulmus","Umbellularia","Uncinia","Uniola","Urceolina","Urginea","Ursinia","Utricularia","Uvularia","Valeriana","Vallea","Vancouveria","Vanda","Vanilla","Veitchia","Vellozia","Veltheimia","Venidium","Veratrum","Verbascum","Verbena","Vernonia","Veronicastrum","Verticordia","Viburnum","Vigna","Viguiera","Vinca","Vitaliana","Vitex","Vitis","Vriesea","Wachendorfia","Wahlenbergia","Waldsteinia","Washingtonia","Weberocereus","Wedelia","Weigela","Weingartia","Weldenia","Welwitschia","Westringia","Widdringtonia","Wigandia","Wigginsia","Wikstroemia","Wisteria","Wittrockia","Wolffia","Woodsia","Woodwardia","Worsleya",
"Wulfenia","Xanthoceras","Xanthorhiza","Xanthosoma","Xeranthemum","Xylosma","Yucca","Yushania","Zaluzianskya","Zamia","Zamioculcas","Zantedeschia","Zanthoxylum","Zauschneria","Zelkova","Zephyranthes","Zigadenus","Zinnia","Zygopetalum"];

var firstName=[
"Glowing",
"Electric",
"Whirling",
"Dog's",
"Eagle's",
"Prismatic",
"World's",
"Bright",
"Atlantic",
"Hazy"
];