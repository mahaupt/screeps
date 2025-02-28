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
        
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0) {
            if (creep.ticksToLive < 100) { 
                // not enough ticks for building, recycle
                creep.memory.renewSelf = true;
                creep.memory.killSelf = true;
                //TODO: spawn replacement
                return;
            }
            baseCreep.deleteSource(creep);
            this.reset(creep); // reset and send get energy
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
            baseCreep.deleteSource(creep);
        }
        
        if (creep.memory.harvesting)
        {
	        if (!creep.memory.source)
	        {
		        baseCreep.pickEnergySource(creep);
	        }
	        
	        baseCreep.goGetEnergyFromSource(creep);
	        
        } else {
            this.build(creep);
        }
    }, 
    
    
    build: function(creep) {
        // get new tasks
        if (!creep.memory.tasks)
        {
            creep.memory.tasks = ConstructionManager.getNewTask(creep.home, creep.store[RESOURCE_ENERGY]);
        }
        let tasks = creep.memory.tasks;
        if (!tasks)
        {
            // IDLE
            creep.say('😴');
            if (creep.home.controller) {
                baseCreep.moveTo(creep, creep.home.controller, {range: 2});
            }
            if (creep.ticksToLive < 100) { 
                // not enough ticks for building, recycle
                creep.memory.renewSelf = true;
                creep.memory.killSelf = true;
                //TODO: spawn replacement
            }
            return;
        }
        
        // target room not visible? move to target room
        let troom = Game.rooms[tasks.r];
        if (!troom && creep.room.name != tasks.r) {
            baseCreep.moveToRoom(creep, tasks.r);
            return;
        }

        // pick target
        if (!creep.memory.target) {
            if (!this.nextTarget(creep)) return;
        }

        var target = Game.getObjectById(creep.memory.target);
        if (!target) { 
            ConstructionManager.recalculateRoom(creep.home); // building finished
            this.nextTarget(creep); 
            return; 
        }
        
        // standard move
        if (!creep.pos.inRangeTo(target, 3)) {
            baseCreep.moveTo(creep, target, {range: 3});
            return;
        }

        // creep stands on edge, move closer
        if (creep.pos.x == 0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49) {
            baseCreep.moveTo(creep, target);
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
            // calc if done repairing in next tick
            let works = _.filter(creep.body, (b) => b == WORK).length;
            if (target.hitsMax-target.hits <= works * REPAIR_POWER)
            {
                this.nextTarget(creep);
            }

            creep.repair(target);
        }
    },

    nextTarget(creep) {
        creep.memory.target = creep.memory.tasks.l.shift();
        if (!creep.memory.target) {
            this.reset(creep);
            return false;
        }
        return true;
    },

    reset: function(creep) {
        creep.memory.harvesting = true;
        delete creep.memory.building;
        delete creep.memory.target;
        delete creep.memory.tasks;
    }
    
};
