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

function fractSystem(ruleSet, axiom, colors)
{
	this.colors=colors;
	this.ruleSet=ruleSet;
	this.axiom=axiom;
	this.curStruct=this.axiom;
	
	this.grow=function()
	{
		this.curStruct=growFract(this.curStruct,this.ruleSet);
	}
}

function growFract(curStruct, ruleSet)
{
	var newStruct="";
	for(var i=0; i<curStruct.length; i++)
	{
		var varFlag=false;
		for(var k=0; k<ruleSet.length; k++)
		{
			if(curStruct[i]==ruleSet[k][0])
			{
				newStruct+=ruleSet[k][1];
				varFlag=true;
			}
		}
		
		if(varFlag==false)
		{
			newStruct+=curStruct[i];
		}
	}
	
	return newStruct;
}