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
            //check energy levels sufficient for building
            if (baseCreep.skipDueEnergyLevels(creep)) return;
            
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
        var repairs = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax && structure.pos.findInRange(FIND_SOURCES, 2).length == 0);
            }
        });
        if (repairs)
        {
            creep.memory.building = repairs.id;
        } else {
        
        
            //construction sites
            var targets = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            if(targets) {
                creep.memory.building = targets.id;
            } else {
                //upgrade if no construction site
                creep.memory.building = creep.room.controller.id;
            }
            
        }
    },
    
    skipDueEnergyLevels: function(creep) {
        var energy = creep.room.energyAvailable;
        var cap = creep.room.energyCapacityAvailable;
        var ratio = energy / cap;
        
        if (cap > 800 && ratio <= 0.3)
        {
            console.log("Builder idling due energy levels");
            return true;
        }
        return false;
    }
    
};

module.exports = roleBuilder;
