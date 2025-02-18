/*
Memory Layout
role = 'builder'
home = home room name

harvesting = true/false
source = source id / container id
building = id of building
*/

module.exports = {
    name: 'builder', 
    run: function(creep) 
    {
        baseCreep.init(creep);
        
        //go home if lost
        if (creep.room.name != creep.memory.home) {
            baseCreep.moveToRoom(creep, creep.memory.home);
            return;
        }
        
        // war mode
        if (creep.room.memory.attacked_time + 30 > Game.time) {
            this.cancelUnimportantTargets(creep);
        }
        
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            if (creep.ticksToLive < 100) { 
                // not enough ticks for building, recycle
                creep.memory.renewSelf = true;
                creep.memory.killSelf = true;
                //TODO: spawn replacement
                return;
            }
            creep.memory.harvesting = true;
            baseCreep.deleteSource(creep);
            delete creep.memory.building;
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            baseCreep.deleteSource(creep);
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
                //war mode
                if (creep.room.memory.attacked_time + 30 > Game.time) {
                    this.pickBuildTargetInWar(creep);
                } else {
                    this.pickBuildTarget(creep);
                }
                
            }
            
            
            var target = Game.getObjectById(creep.memory.building);
            if (!target) { delete creep.memory.building; return; }
            
            if (!creep.pos.inRangeTo(target, 3)) {
                baseCreep.moveTo(creep, target, {range: 3});
                return;
            }

            if (target instanceof ConstructionSite)
            {
                creep.build(target)
            } 
            else if (target instanceof StructureController) 
            {
                creep.upgradeController(creep.room.controller);
            }
            else 
            {
                creep.repair(target);
                if (target.hits == target.hitsMax)
                {
                    delete creep.memory.building;
                }
            }
            
	       
        }
    }, 
    
    
    pickBuildTarget: function(creep) {
        delete creep.memory.dismantle;
        
        //repairs needed
        var repairs = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return (
                    structure.structureType != STRUCTURE_WALL && 
                    structure.structureType != STRUCTURE_RAMPART && 
                    structure.hits < structure.hitsMax*0.8);
            }
        });
        if (repairs)
        {
            creep.memory.building = repairs.id;
            return;
        }
        
        
        //dismantle
        /*var dismantles = creep.pos.findClosestByRange(FIND_FLAGS, 
            {filter: (s) => s.name.search("dismantle") == 0});
        if (dismantles) {
            creep.memory.dismantle = true;
            //let structure = dismantles.pos.findInRange()
        }*/
        
        
        //construction sites
        var targets = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if(targets) {
            creep.memory.building = targets.id;
            return;
        }
        
        
        //fortify walls
        var wallhp = creep.room.memory.walls;
        var walls = creep.room.find(FIND_STRUCTURES, {filter: (s) => { 
            return (s.structureType == STRUCTURE_WALL || 
            s.structureType == STRUCTURE_RAMPART) && 
            s.hits < s.hitsMax &&
            s.hits < wallhp; 
        }});
        if (walls.length > 0) {
            walls = _.sortBy(walls, (s) => s.hits);
            creep.memory.building = walls[0].id;
            return;
        }
        
        //upgrade if no thing else to do
        if (creep.room.controller) {
            creep.memory.building = creep.room.controller.id;
        }
        

    }, 
    
    
    cancelUnimportantTargets: function(creep)
    {
        //if creep is outside bunker - move inside bunker
        var cpoint = moduleAutobuilder.getBaseCenterPoint(creep.room);
        var building = Game.getObjectById(creep.memory.building);
        var source = Game.getObjectById(creep.memory.source);
        
        //build target
        if (building) 
        {
            let dist = cpoint.getRangeTo(building.pos);
            if (dist > 9) {
                delete creep.memory.building;
            }
        }
        
        //source outside base
        if (source) 
        {
            let dist = cpoint.getRangeTo(source.pos);
            if (dist > 6) {
                baseCreep.deleteSource(creep);
            }
        }
        
        //creep outside base
        let dist = cpoint.getRangeTo(creep.pos);
        if (dist > 6) {
            let dir = baseCreep.moveTo(creep, cpoint);
        }
    }, 
    
    
    pickBuildTargetInWar: function(creep)
    {
        var cpoint = moduleAutobuilder.getBaseCenterPoint(creep.room);
        
        //pick wall and tower repairs
        var walls = creep.room.find(FIND_STRUCTURES, {filter: (s) => { 
            return (s.structureType == STRUCTURE_WALL || 
            s.structureType == STRUCTURE_RAMPART) && 
            s.hits < s.hitsMax && 
            s.pos.getRangeTo(cpoint) <= 9
        }});
        if (walls.length > 0) {
            walls = _.sortBy(walls, (s) => s.hits);
            creep.memory.building = walls[0].id;
            return true;
        }
        
        // nothing to do, do normal stuff
        this.pickBuildTarget(creep);
    }
    
};
