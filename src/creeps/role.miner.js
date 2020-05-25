/*
Memory Layout
.role = "miner"
.harvesting = true/false
.renewSelf = true/false
.source = source.id
.container = container.id
.link = link.id	
.containerLinkPurge - special mode pouring the container into the link
Priorities of dropoff
- Link
- Container if link full or not avbl
- Carry to base if Container full or no hauler avbl
*/

module.exports = {

    run: function(creep) 
    {    
        baseCreep.init(creep);
        
	    //first - pick own source
	    if (!creep.memory.source) {
		    this.pickOwnSource(creep);
	    }
        
        //periodically check mining link avbl
        if (!creep.memory.link && creep.room.controller.level >= 5){
            if (Game.time % 20 == 1) {
                this.pickOwnLink(creep);
            }
        }
        
        //Special mode
        if (creep.memory.containerLinkPurge) {
            this.containerLinkPurge(creep);
            return;
        }
        
	    //switching btn harvesting and dropping
        if (!creep.memory.harvesting && creep.store.getUsedCapacity() == 0) {
            creep.memory.harvesting = true;
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            
            //check link avbl
            if (!creep.memory.link && creep.room.controller.level >= 5)
            {
                this.pickOwnLink(creep);
            }
            
            //try to pick own container for container harvesting
            if (!creep.memory.container) {
                this.pickOwnContainer(creep);
            } else if (!this.containerHasHauler(creep, creep.memory.container)) 
            {
                //hauler died - go back to normal harvesting
                delete creep.memory.container;
            }
        }
        
        
	    if(creep.memory.harvesting) 
	    {
            this.harvest(creep);
        }
        else 
        { 
            this.dropoff(creep);
        }
	},
    
    
    harvest: function(creep)
    {
        //go to source and harvest
        var s = Game.getObjectById(creep.memory.source);
        if(creep.harvest(s) != OK) {
            creep.moveTo(s, {visualizePathStyle: {stroke: '#ff0000'}});
        }
        
        //source depleted - time to renew?
        if (creep.ticksToLive <= CREEP_LIFE_TIME/3) {
            if (s.energy == 0 && s.ticksToRegeneration >= 50) {
                creep.memory.renewSelf = true;
            }
        }
        
        //mineral depleted - kill self
        if (s instanceof Mineral) {
            if (s.mineralAmount == 0 && s.ticksToRegeneration >= 3600) {
                creep.memory.killSelf = true;
                creep.memory.renewSelf = true;
            }
        }
        
        //link abvl - carry to link immediately
        //ENERGY ONLY
        if (creep.memory.link)
        {
            //put stuff into link
            var l = Game.getObjectById(creep.memory.link);
            if (!l) { delete creep.memory.link; return; }
            var xx = creep.transfer(l, RESOURCE_ENERGY);
            
            //link full, send to spawn
            if (l.store.getFreeCapacity(RESOURCE_ENERGY) == 0 || creep.memory.renewSelf) {
                baseCreep.sendLinkToSpawn(l);
            }
            
            //switch to special mode if container storage full
            if (l.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && creep.memory.container)
            {
                let c = Game.getObjectById(creep.memory.container);
                if (!c) { delete creep.memory.container; return; }
                if (c.store.getUsedCapacity(RESOURCE_ENERGY) > LINK_CAPACITY) {
                    creep.memory.containerLinkPurge = true;
                }
            }
            
            if (xx == OK) {
                return;
            }
        }
        
        //container in range - carry to container immediately
        if (creep.memory.container)
        {
            //put stuff into container
            let c = Game.getObjectById(creep.memory.container);
            if (!c) { delete creep.memory.container; return; }
            if (c.hits == c.hitsMax || c.store[RESOURCE_ENERGY] == 0) 
            { // if damaged keep energy and repair later
                let res_types = baseCreep.getStoredResourceTypes(creep.store);
                creep.transfer(c, res_types[0]);
            }
        }
    }, 
    
    
    dropoff: function(creep)
    {
        //MC damaged or full
        if (creep.memory.container)
        {
            var c = Game.getObjectById(creep.memory.container);
            if (!c) { delete creep.memory.container; return; }
            
            
            //repair needed and has energy
            if (c.hits < c.hitsMax && c.store[RESOURCE_ENERGY] > 0) {
                if (creep.repair(c) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(c, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            } 
            else if (c.store.getFreeCapacity() == 0) 
            {   //full
                //stop container mining temp. and assist transport chain
                delete creep.memory.container;
                creep.say("MC full!");
                this.carryBackToBase(creep);
            } else {
                //not in range mostl likely - move and tx
                var res_types = baseCreep.getStoredResourceTypes(creep.store);
                if (creep.transfer(c, res_types[0])== ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(c, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            }
            
        } else {
            //no mining container
            this.carryBackToBase(creep);
        }
    }, 
    
    //special mode - picks up Energy from container
    //and drops into link
    containerLinkPurge: function(creep)
    {
        var c = Game.getObjectById(creep.memory.container);
        var l = Game.getObjectById(creep.memory.link);
        
        if (!c) { 
            delete creep.memory.container;
            delete creep.memory.containerLinkPurge;
            return;
        }
        if (!l) {
            delete creep.memory.link;
            delete creep.memory.containerLinkPurge;
            return;
        }
        
        
        
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            //pickup
            if (creep.withdraw(c, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(c, {visualizePathStyle: {stroke: '#ff0000'}});
            }
        } else {
            //dropoff
            if (creep.transfer(l, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(l, {visualizePathStyle: {stroke: '#00ff00'}});
            }
        }
        
        //terminating pouring
        if (c.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || 
            l.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            delete creep.memory.containerLinkPurge;
        }
    }, 
	
    //carry back to base into structures
	carryBackToBase: function(creep) 
	{
        var res_types = baseCreep.getStoredResourceTypes(creep.store);
        
		var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_STORAGE || 
                    structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(res_types[0]) > 0;
            }
        });

        if(targets.length > 0) 
        {
            if(creep.transfer(targets[0], res_types[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#00ff00'}});
            }
        } else if (creep.store[RESOURCE_ENERGY] > 0) {
            //maybe build construction sites - if energy avbl
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    		if(targets.length > 0) {
    			if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
    				creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#00ff00'}});
    			}
    		} else {
    		    //upgrade if no construction site
    		    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
                }
    		}
        }
	}, 
	
    
	pickOwnSource: function(creep) {
		var sources = creep.room.find(FIND_SOURCES);
        
        //also add minerals if extractors present
        if (
            creep.room.find(
                FIND_STRUCTURES, 
                {filter: (s) => s.structureType == STRUCTURE_EXTRACTOR}
            ).length > 0) 
        {
            sources = sources.concat(creep.room.find(FIND_MINERALS));
            
        }
		
		//find new unoccupied source
		var sourcePicked = {};
		for (var source of sources)
		{
			sourcePicked[source.id] = 0;
			
			for (var i in Memory.creeps)
			{
				if (Memory.creeps[i].source == source.id &&
                     Memory.creeps[i].role == "miner")
				{
					sourcePicked[source.id]++;
				}
			}
		}
		
		var min_picked = 9999;
		var min_id = false;
		for(var sid in sourcePicked)
		{
			if (min_picked > sourcePicked[sid]) {
				min_id = sid;
				min_picked = sourcePicked[sid];
			}
		}
		
		if (min_id) {
			creep.memory.source = min_id;
			return true;
		}
		
		return false;
	}, 
	
	pickOwnContainer: function(creep) {
		//search containers
		if (!creep.memory.source) return false;
		var s = Game.getObjectById(creep.memory.source);
		var container = this.getMiningStructure(s, STRUCTURE_CONTAINER);
        if (container) {
            if (this.containerHasHauler(creep, container.id))
            {
                creep.memory.container = container.id;
                return true;
            }
		}
		
		return false;
	},
    
    pickOwnLink: function(creep) {
        if (!creep.memory.source) return false;
		var s = Game.getObjectById(creep.memory.source);
        
        //check if there is a link around spawn
        var spawnlink = baseCreep.getSpawnLink(creep.room);
        if (!spawnlink) return false;
        
        var link = this.getMiningStructure(s, STRUCTURE_LINK);
        if (link) {
            creep.memory.link = link.id;
            return true;
        }
        return false;
    }, 
    
    getMiningStructure: function(source, type)
    {
        var structures = source.pos.findInRange(FIND_STRUCTURES, 2, {
	        filter: (structure) => {
	            return structure.structureType == type;
	        }});
        
        if (structures.length > 0)
		{
            return structures[0];
		}
        return false;
    },
	
	
    //todo: update multiroom
	containerHasHauler: function(creep, containerid)
	{
        //link acts as hauler
        if (creep.memory.link) return true;
        
		for (var i in Memory.creeps)
		{
			if (Memory.creeps[i].role == "hauler")
			{
				return true;
			}
		}
		return false;
	}
    
};
