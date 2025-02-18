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
    name: 'miner', 
    run: function(creep) 
    {    
        baseCreep.init(creep);
        
        //go home if lost
        if (creep.room.name != creep.memory.home) {
            baseCreep.moveToRoom(creep, creep.memory.home);
            return;
        }
        
        var source = this.getSource(creep);
        var container = this.getContainer(creep, source);
        var link = this.getLink(creep, source);

        // spawn replacement
        if (!creep.memory.replacementSpawned && creep.ticksToLive <= creep.memory.travelTime) {
            creep.memory.replacementSpawned = true;
            this.replaceSelf(creep);
        }
        
        //Special mode
        if (creep.memory.containerLinkPurge) {
            if (this.containerLinkPurge(creep, container, link)) {
                //busy
                return;
            }
        }
        
	    //switching btn harvesting and dropping
        if (!creep.memory.harvesting && creep.store.getUsedCapacity() == 0) {
            creep.memory.harvesting = true;
            
            delete creep.memory.selfDropoff;
            delete creep.memory.target;
        } else 
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
        }
        
        
	    if(creep.memory.harvesting) 
	    {
            this.harvest(creep, source, container, link);
        }
        else 
        { 
            this.dropoff(creep, source, container, link);
        }
	},
    
    
    harvest: function(creep, source, container, link)
    {        
        //mineral depleted - kill self
        if (source instanceof Mineral) {
            if (source.mineralAmount == 0 && source.ticksToRegeneration >= 3600) {
                creep.memory.killSelf = true;
                creep.memory.renewSelf = true;
            }
        }
        
        //HARVEST
        if (!creep.pos.inRangeTo(source, 1)) {
            baseCreep.moveTo(creep, source, {range: 1});
        } else {
            creep.harvest(source);
            if (!creep.memory.travelTime) {
                creep.memory.travelTime = 1500 - creep.ticksToLive + creep.body.length*3;
            }
        }

        //link abvl - carry to link immediately
        //ENERGY ONLY
        if (link)
        {
            //put energy into link
            let ret = creep.transfer(link, RESOURCE_ENERGY);
            
            //link full, send to spawn
            if (link.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                baseCreep.sendLinkToSpawn(link);
            }
            
            //switch to special mode if container storage full
            if (link.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && container)
            {
                if (container.store.getUsedCapacity(RESOURCE_ENERGY) > LINK_CAPACITY) {
                    creep.memory.containerLinkPurge = true;
                }
            }
            
            if (ret == OK) {
                return;
            }
        }
        
        //container in range - carry to container immediately
        if (container)
        {
            //transfer res into containers
            let res_types = baseCreep.getStoredResourceTypes(creep.store);
            creep.transfer(container, res_types[0]);
            
            if (!link) {
                this.addContainerTransportTask(container);
            }
        }

        // no link or container - drop
        if (!link && !container) {
            let res_types = baseCreep.getStoredResourceTypes(creep.store);
            creep.drop(res_types[0]);
            // TODO: update logistics task
        }
    }, 
    
    
    dropoff: function(creep, source, container, link)
    {        
        //Miner full - move in range for dropoff
        if (link) {
            if (link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                if (creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    baseCreep.moveTo(creep, link, {range: 1});
                }
                return;
            } else {
                baseCreep.sendLinkToSpawn(link);
            }
        }
        
        
        if (container)
        {
            if (container.store.getFreeCapacity() > 0) {
                var res_types = baseCreep.getStoredResourceTypes(creep.store);
                if (creep.transfer(container, res_types[0])== ERR_NOT_IN_RANGE)
                {
                    baseCreep.moveTo(creep, container, {range: 1});
                }
                if (!link) {
                    this.addContainerTransportTask(container);
                }
                return;
            } 
        }
    }, 
    
    //special mode - picks up Energy from container
    //and drops into link
    containerLinkPurge: function(creep, container, link)
    {
        if (!container || !link) { 
            delete creep.memory.containerLinkPurge;
            return false;
        }
        
        //terminating pouring
        if (container.store.getUsedCapacity(RESOURCE_ENERGY) == 0 || 
            link.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            delete creep.memory.containerLinkPurge;
            return false;
        }
        
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            //pickup
            if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                baseCreep.moveTo(creep, container, {range: 1});
            }
        } else {
            //dropoff
            if (creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                baseCreep.moveTo(creep, link, {range: 1});
            }
        }
        
        return true;
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
		let sourcePicked = {};
        let terrain = creep.room.getTerrain();

		for (var source of sources)
		{
			sourcePicked[source.id] = 0;
			
            // count miners on source
			for (var i in Memory.creeps)
			{
				if (Memory.creeps[i].source == source.id &&
                     Memory.creeps[i].role == "miner")
				{
					sourcePicked[source.id]++;
				}
			}

            // count free spots on source
            let pos = source.pos;
            let free_spots = 0
            for (var x = -1; x <= 1; x++) {
                for (var y = -1; y <= 1; y++) {
                    if (x == 0 && y == 0) continue;
                    if (terrain.get(pos.x + x, pos.y + y) != TERRAIN_MASK_WALL) {
                        free_spots++;
                    }
                }
            }

            // already too many miners on source
            if (sourcePicked[source.id] >= free_spots) {
                sourcePicked[source.id] = 9999;
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
	
	pickOwnContainer: function(creep, source) {
		//search containers
		var container = this.getMiningStructure(source, STRUCTURE_CONTAINER);
        if (container) {
            creep.memory.container = container.id;
            return true;
		}
		
		return false;
	},
    
    pickOwnLink: function(creep, source) {
        //only use links for sources
        if (!(source instanceof Source)) return false;
        
        //check if there is a link around spawn
        var spawnlink = baseCreep.getSpawnLink(creep.room);
        if (!spawnlink) return false;
        
        var link = this.getMiningStructure(source, STRUCTURE_LINK);
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
    
    
    getSource: function(creep)
    {
        if (!creep.memory.source) {
            this.pickOwnSource(creep);
        }
        
        return Game.getObjectById(creep.memory.source);
    }, 
    
    getContainer: function(creep, source)
    {
        if (!creep.memory.container) {
            if (Game.time % 20 != 2) return null;
            if (!this.pickOwnContainer(creep, source)) {
                return null;
            }
        }
        
        var container = Game.getObjectById(creep.memory.container);
        if (container) {
            return container;
        } else {
            delete creep.memory.container;
            return null;
        }
    }, 
    
    getLink: function(creep, source)
    {
        if (creep.room.controller.level < 5) return null;
        
        if (!creep.memory.link) {
            if (Game.time % 20 != 3) return null;
            if (!this.pickOwnLink(creep, source)) {
                return null;
            }
        }
        
        var link = Game.getObjectById(creep.memory.link);
        if (link) {
            return link;
        } else {
            delete creep.memory.link;
            return null;
        }
    },
    
    addContainerTransportTask: function(container)
    {
        var res_types = baseCreep.getStoredResourceTypes(container.store);
        res_types = _.sortBy(res_types, (r) => -container.store.getUsedCapacity(r));
        if (res_types.length > 0 && 
            container.store.getUsedCapacity(res_types[0]) >= 200) 
        {
            Logistics.addTransportTask(
                container.room, 
                container.id, 
                null, 
                container.store.getUsedCapacity(res_types[0]), 
                res_types[0], 
                5, 
                "mc");
        }
    },

    replaceSelf: function(creep)
    {
        // get all creeps that have same source (self is excluded)
        var creeps = _.filter(Game.creeps, (c) => c.memory.source == creep.memory.source && !c.memory.replacementSpawned);
        if (creeps.length >= 1 && creep.body.length >= 10) return; // there is already another miner
        moduleSpawn.addSpawnList(
            creep.room, 
            "miner", 
            {
                source: creep.memory.source, 
                container: creep.memory.container, 
                link: creep.memory.link
            }
        );
    }
};
