var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.harvesting = true;
            delete creep.memory.source;
            delete creep.memory.building;
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            delete creep.memory.source;
            delete creep.memory.building;
        }
        
        if (creep.memory.harvesting)
        {
	        if (!creep.memory.source)
	        {
		        baseCreep.pickEnergySource(creep);
	        }
	        
	        baseCreep.goGetEnergyFromSource(creep);
	        
        } else {
            
            if (!creep.memory.building)
            {
                roleBuilder.pickBuildTarget(creep);
            }
            
            
            var target = Game.getObjectById(creep.memory.building);
            if (!target) { delete creep.memory.building; return; }
            
            if (target instanceof ConstructionSite)
            {
                //build
                if(creep.build(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            } 
            else if (target instanceof StructureController) 
            {
                //upgrade
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            }
            else 
            {
                //repair
                if(creep.repair(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
                }
                if (target.hits == target.hitsMax)
                {
                    delete creep.memory.building;
                }
            }
            
	       
        }
    }, 
    
    
    pickBuildTarget: function(creep) {
        
        //repairs needed - except mining containers
        var repairs = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax && structure.pos.findInRange(FIND_SOURCES, 2).length == 0);
            }
        });
        if (repairs.length > 0)
        {
            creep.memory.building = repairs[0].id;
        } else {
        
        
            //construction sites
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length > 0) {
                creep.memory.building = targets[0].id;
            } else {
                //upgrade if no construction site
                creep.memory.building = creep.room.controller.id;
            }
            
        }
    }
}

module.exports = roleBuilder;
