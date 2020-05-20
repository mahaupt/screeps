var baseCreep = {
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
		//dropped energy
		if (baseCreep.pickupDroppedEnergy(creep, 4)) { return; }
		
		var source = Game.getObjectById(creep.memory.source);
        if (!source) { delete creep.memory.source; return; }
        
        if (source instanceof Source) {
	        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ff0000'}});
            }
        }
        else
        {
	        if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ff0000'}});
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
		
		//statistics
		var ncontainer = room.find(FIND_STRUCTURES, {
	        filter: (structure) => {
	            return structure.structureType == STRUCTURE_CONTAINER;
	        }}).length;
			
		
		if (role=='miner')
		{
			nwork = Math.floor(1.5*bodySize);
			ncarry = Math.max(Math.floor(0.5*bodySize), 1);
			nmove = Math.max(Math.floor(0.5*bodySize), 1);
			
			//container miner
			if (ncontainer > 0 && bodySize == 1) {
				nwork = 2;
				ncarry = 1;
				nmove = 1;
			}
		}
		if (role=='hauler')
		{
			nwork=0;
			ncarry = Math.min(2*bodySize, 25);
			nmove = Math.min(2*bodySize-1, 25);
		}
		if (role=='scout')
		{
			nwork=1;
			ncarry = bodySize;
			nmove = Math.floor(2.5*bodySize);
		}
		if (role == 'pioneer')
		{
			nwork=3;
			ncarry=4;
			nmove=7;
		}
		if (role == 'claimer')
		{
			nwork=0;
			ncarry=0;
			nclaim=1;
			nmove=1;
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
		
		
		return body;
	}, 
	
	getSuitableBodySize: function(role, availableEnergy) {
		var size = Math.floor(availableEnergy/400);
		size = Math.max(size, 1);
		
		if (availableEnergy >= 500 && availableEnergy <= 800)
		{
			size = 2;
		}
		
		//role specific modifier
		if (role == 'miner') {
			//max body size
			size = Math.min(size, 5);
		}
		
		return size;
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
        var spawnlink = baseCreep.getSpawnLink(link.room);
        if (spawnlink) 
        {
            //spawnlink has full capacity
            if (spawnlink.store.getFreeCapacity(RESOURCE_ENERGY) == LINK_CAPACITY)
            {
                link.transferEnergy(spawnlink);
                return true;
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
            //console.log("Builder idling due energy levels");
			creep.moveTo(creep.room.controller);
            return true;
        }
        return false;
    }, 
	
	moveToRoom: function(creep, name) {
        var pos = new RoomPosition(25, 25, name);
        creep.moveTo(pos);
    }, 
};


module.exports = baseCreep;