module.exports = {
	getName: function(room, role)
	{
		var baseName = role + "-#";
		var name = "";
		
		do {
			name = baseName + this.getRandomString(3);
		} while (Game.creeps[name]);
		
		return name;
	},
	
	getRandomString: function(length) {
	    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	    var result = '';
	    for ( var i = 0; i < length; i++ ) {
	        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
	    }
	    return result;
	},
	
	
	pickEnergySource: function(creep) 
    {
	    //try to find half full containers
	    var c = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return ((structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store.getUsedCapacity(RESOURCE_ENERGY)/structure.store.getCapacity(RESOURCE_ENERGY) > 0.3) || 
					
                    ((structure.structureType == STRUCTURE_CONTAINER || 
					structure.structureType == STRUCTURE_STORAGE) && structure.pos.findInRange(FIND_SOURCES, 2).length == 0 && 
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0);
            }
        });
        if (c)
        {
	        creep.memory.source = c.id;
	    } else {
		    var s = creep.pos.findClosestByPath(FIND_SOURCES);
		    if (s) {
		    	creep.memory.source = s.id;
		    }
	    }
    },
    
    
	goGetEnergyFromSource: function(creep)
	{	
		var source = Game.getObjectById(creep.memory.source);
        if (!source) { delete creep.memory.source; return; }
        
        if (source instanceof Source) {
	        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {range: 1, visualizePathStyle: {stroke: '#ff0000'}});
            }
        }
        else
        {
	        if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {range: 1, visualizePathStyle: {stroke: '#ff0000'}});
            }
            
            //source empty - search other one
            if (source.store.getUsedCapacity(RESOURCE_ENERGY) == 0)
            {
	            delete creep.memory.source;
            }
        }
	},
	
	
	pickupDroppedEnergy: function(creep, range)
	{	
		if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
			
			var res = creep.pos.findInRange(FIND_DROPPED_RESOURCES, range);
			var ts = creep.pos.findInRange(FIND_TOMBSTONES, range);
			var ru = creep.pos.findInRange(FIND_RUINS, range);
				
			var targets = res.concat(ts).concat(ru);
			
			if (targets.length > 0) {
				var dist = creep.pos.getRangeTo(targets[0]);
				
				var amount = targets[0].amount || targets[0].store[RESOURCE_ENERGY];
				//console.log("amount: " + amount);
				
				//worth it?
				if (amount > 0 && amount > dist*10) 
				{
					//console.log("dropped res found - pickup");
					
					if (targets[0] instanceof Resource) {
						if (creep.pickup(targets[0]) == ERR_NOT_IN_RANGE) {
							creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ff0000'}});
						}
					} else {
						if (creep.withdraw(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
							creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ff0000'}});
						}
					}
					
					return true;
					
				}
			}
		}
		
		return false;
	},
	
	
	buildBody: function(room, role, bodySize) {
		var body = [];
		
		var ntough = 0;
		var nwork = bodySize;
		var ncarry = bodySize;
		var nclaim = 0;
		var nmove = bodySize;
		var nattack = 0;
		var nrattack = 0;
		var nheal = 0;
		
		//statistics
		var ncontainer = room.find(FIND_STRUCTURES, {
	        filter: (structure) => {
	            return structure.structureType == STRUCTURE_CONTAINER;
	        }}).length;
			
		
		if (role=='miner')
		{
			bodySize = Math.min(bodySize, 5);
			nwork = Math.floor(1.5*bodySize);
			ncarry = Math.max(Math.floor(0.5*bodySize), 1);
			nmove = Math.max(Math.floor(0.5*bodySize), 1);
			
			//container miner
			if (ncontainer > 0 && bodySize == 1) {
				nwork = 2;
				ncarry = 1;
				nmove = 1;
			}
		} else 
		if (role=='hauler')
		{
			bodySize = Math.min(bodySize, 8);
			nwork=0;
			ncarry = Math.min(2*bodySize, 25);
			nmove = Math.min(2*bodySize-1, 25);
		} else 
		if (role=='scout')
		{
			nwork=0;
			ncarry = 0;
			nmove = 1;
		} else 
		if (role == 'pioneer')
		{
			nwork=3;
			ncarry=4;
			nmove=7;
		} else 
		if (role == 'claimer')
		{
			nwork=0;
			ncarry=0;
			nclaim=1;
			nmove=1;
		} else 
		if (role == 'soldier')
		{
			bodySize = Math.min(bodySize, 16);
			nwork=0;
			ncarry=0;
			ntough=1*bodySize; //10
			nmove=1*bodySize+1; //50
			nrattack=bodySize; //150
			nheal=1; // 250
		} else 
		if (role == 'tank')
		{
			bodySize = Math.min(bodySize, 16);
			nwork=0;
			ncarry=0;
			ntough=29; //10
			nmove=17; //50
			nheal=4; // 250
		}
		//upgrader && builder == standard
		
		
		//max 50 body parts - reducing
		if (nwork + ncarry + nmove > 50)
		{
			var above = nwork + ncarry + nmove - 50;
			nwork -= Math.ceil(nwork/50*above);
			ncarry -= Math.ceil(ncarry/50*above);
			nmove -= Math.ceil(nmove/50*above);
		}
		
		
		//Tough
		for (var h=0; h < ntough; h++)
		{
			body.push(TOUGH);
		}
		
		//WORK
		for (var i=0; i<nwork; i++)
		{
			body.push(WORK);
		}
		
		//CARRY
		for (var j=0; j<ncarry; j++)
		{
			body.push(CARRY);
		}
		
		//CLAIM
		for (var k=0; k < nclaim; k++) {
			body.push(CLAIM);
		}
		
		//MOVE
		for (var l=0; l<nmove; l++)
		{
			body.push(MOVE);
		}
		
		//attack
		for (var m=0; m<nattack; m++)
		{
			body.push(ATTACK);
		}
		
		//ranged attack
		for (var n=0; n<nrattack; n++)
		{
			body.push(RANGED_ATTACK);
		}
		
		//heal
		for (var o=0; o<nheal; o++)
		{
			body.push(HEAL);
		}
		
		
		return body;
	}, 
	
	getSuitableBodySize: function(role, availableEnergy) {
		var size = Math.floor(availableEnergy/400);
		size = Math.max(size, 1);
		
		if (availableEnergy >= 500 && availableEnergy <= 800)
		{
			size = 2;
		}
		
		return size;
	}, 
	
	//get equivalent body size considering boosts
	getCreepBodyStrength: function(creep) {
		var bodySize = 0;
		for (var i in creep.body) 
		{
			var add = 1;
			if (creep.body[i].boost) {
				var effect = BOOSTS[creep.body[i].type][creep.body[i].boost];
				add *= effect[Object.keys(effect)[0]];
			}
			bodySize += add;
		}
		return bodySize;
	}, 
	
	getSpawnLink: function(room) {
        var spawn = room.find(FIND_STRUCTURES, {
	        filter: (structure) => {
	            return (structure.structureType == STRUCTURE_SPAWN);
	        }});
        if (spawn.length > 0) {
            var spawnlink = spawn[0].pos.findInRange(FIND_STRUCTURES, 2, {
    	        filter: (structure) => {
    	            return (structure.structureType == STRUCTURE_LINK);
    	        }});
            if (spawnlink.length > 0) {
                return spawnlink[0];
            }
        }
        
        return false;
    },
	
	sendLinkToSpawn: function(link) 
    {
		if (link.cooldown > 0) return false;
        var spawnlink = this.getSpawnLink(link.room);
        if (spawnlink) 
        {
            //spawnlink has full capacity
            if (spawnlink.store.getFreeCapacity(RESOURCE_ENERGY) == LINK_CAPACITY)
            {
                if (link.transferEnergy(spawnlink) == OK) 
				{
					var amt = Math.round(link.store[RESOURCE_ENERGY] * (1-LINK_LOSS_RATIO));
					moduleLogistics.addTransportTask(link.room, spawnlink, link.room.storage, amt, RESOURCE_ENERGY, 7, "l", true);
					return true;
				}
            } else {
                //console.log("Spawnlink full");
            }
        }
        return false;
    }, 
	
	skipDueEnergyLevels: function(creep) {
        var energy = creep.room.memory.total_energy;
        var cap = creep.room.memory.total_capacity;
        var ratio = energy / cap;
        
        if (cap > 800 && ratio <= 0.1)
        {
            creep.say("😴");
			creep.moveTo(creep.room.controller);
            return true;
        }
        return false;
    }, 
	
	//source callback avoiding source keepers
	avoidSourceCostCallback: function(rname, costs)
	{
		var room = Game.rooms[rname];
		
		if (!room) return;
		
		var sources = room.find(FIND_SOURCES);
		var minerals = room.find(FIND_MINERALS);
		var avoids = [].concat(sources, minerals);
		
		_.forEach(avoids, function(avoid){
			var xStart = avoid.pos.x - 5;
			var xEnd = avoid.pos.x + 5;
			var yStart = avoid.pos.y - 5;
			var yEnd = avoid.pos.y + 5;

			for(var x = xStart; x <= xEnd; x++) {
				for(var y = yStart; y <= yEnd; y++) {
					costs.set(x, y, 20);
				}
			}
		});

	}, 
	
	//moves creep to room name, avoids source keeper
	moveToRoom: function(creep, name, travelSafe=true) {
        var pos = new RoomPosition(25, 25, name);
		
		if (travelSafe) {
	        creep.moveTo(pos, {
				reusePath: 10, 
				costCallback: this.avoidSourceCostCallback, 
				swampCost: 3, 
				visualizePathStyle: {stroke: '#ffff00'}
			});
		} else {
			creep.moveTo(pos, {visualizePathStyle: {stroke: '#ffff00'}});
		}
    }, 
	
	init: function(creep) {
		//set home
        if (!creep.memory.home) {
            creep.memory.home = creep.room.name;
        }
	}, 
	
	getStoredResourceTypes: function(store) {
		if (!store) return [];
		return _.filter(Object.keys(store), resource => store[resource] > 0);
	}, 
	
	
	prepareCreep: function(creep)
    {
        //renew creeps
        var spawns = creep.room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_SPAWN});

        if (spawns.length > 0)
        {
            var xx = spawns[0].renewCreep(creep);
            if (xx == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawns[0], {range: 1, visualizePathStyle: {stroke: '#0000ff'}});
            } else if (xx == ERR_FULL) {
				creep.memory.embark = true;
			}
        }
    }, 
	
	flee: function(creep)
	{
		//drop energy and flee to next tower
		
	}
};