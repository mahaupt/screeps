/*
Memory Layout
.role = "hauler"
.harvesting = true/false
.renewSelf = true/false
.container = container.id // link.id
.target = target.id
*/

var roleHauler = {
	run: function(creep) {		
		if (!creep.memory.harvesting && creep.store.getUsedCapacity() == 0 || 
			!creep.memory.task) {
            creep.memory.harvesting = true;
			delete creep.memory.target;
			
			//pick new task
			creep.memory.task = moduleLogistics.getTask(creep.room, creep.store.getCapacity());
			if (creep.memory.task) {
				if (creep.memory.task.r) {
					creep.memory.target = creep.memory.task.r;
				}
			}
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
			
			//finish task
			moduleLogistics.dropTask(creep.room, creep.memory.task, creep.store.getCapacity());
			creep.memory.task.s = null;
			
        }
        
        if (creep.memory.harvesting && creep.memory.task)
        {
	        roleHauler.pickup(creep);
        } 
        else 
        {
			roleHauler.dropoff(creep);
	    }
	}, 
	
	pickup: function(creep) 
	{
		var s = Game.getObjectById(creep.memory.task.s);
		if (!s) { 
			delete creep.memory.task; 
			return; 
		}
		
		//select resource for pickup
		var amount = s.amount || s.store[RESOURCE_ENERGY];
		var resource = RESOURCE_ENERGY;
		var multi_pickup = false;
		if (creep.memory.task.res) 
		{
			//prefedined resource for pickup
			resource = creep.memory.task.res;
			amount =  s.store[resource];
		} else 
		if (creep.memory.task.t == "mc") 
		{
			//mining container, pickup all resources
			amount = s.store.getUsedCapacity();
			var res_types = baseCreep.getStoredResourceTypes(s.store);
			resource = res_types[0];
			multi_pickup = res_types.length > 1;
		}
		
		var ret = null;
		if (s instanceof Resource){
			ret = creep.pickup(s);
		} else {
			ret = creep.withdraw(s, resource);
		}
		
		if (ret  == ERR_NOT_IN_RANGE) {
			creep.moveTo(s, {visualizePathStyle: {stroke: '#ff0000'}});
		}
		
		
		//no more energy in container - stop and carry to base
		if (amount < creep.store.getFreeCapacity() && 
			ret == OK && 
			!multi_pickup || 
			amount == 0)
		{
			creep.memory.harvesting = false;
			moduleLogistics.deleteTask(creep.room, creep.memory.task);
		}
	}, 
	
	
	dropoff: function(creep) 
	{
		//pick energy receiver
		if (!creep.memory.target) {
			roleHauler.pickReceiver(creep);
		}
		
		
		var target = Game.getObjectById(creep.memory.target);
		if (target) 
		{
			//select resource for transfer if target is storage
			var resource = RESOURCE_ENERGY;
			var stored_resources = baseCreep.getStoredResourceTypes(creep.store);
			var multi_dropoff = false;
			if (target instanceof StructureStorage || 
				target instanceof StructureContainer || 
				target instanceof StructureTerminal) 
			{
				multi_dropoff = stored_resources.length > 1;
				resource = stored_resources[0];
			}
			
			//go to target and transfer
			var ret = creep.transfer(target, resource);
			if(ret == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
			}
			//target full - search new target
			if (target.store.getFreeCapacity(resource) == 0) {
				delete creep.memory.target;
			}
			//target will be full i next tick
			if (ret == OK && !multi_dropoff) {
				if (target.store.getFreeCapacity(resource) <= creep.store[resource]) {
					delete creep.memory.target;
				}
			}
		}
		else 
		{
			//delete just in case
			delete creep.memory.target;
			
			//no free capacity - just walk to spawn and wait
			var spawn = creep.room.find(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_SPAWN);
				}
			});
			if (spawn.length > 0)
			{
				creep.moveTo(spawn[0], {visualizePathStyle: {stroke: '#00ff00'}});
			}
			
		}
	}, 


	pickReceiver: function(creep) {
		var res_types = baseCreep.getStoredResourceTypes(creep.store);
		var resource = res_types[0];
		
		var prio1 = null;
		var prio2 = null;
		if (resource == RESOURCE_ENERGY) 
		{
			//CARRY ENERGY TO PRIORITY TARGETS
			// Prio 1: SPAWNS, Extensions
			prio1 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_EXTENSION ||
						structure.structureType == STRUCTURE_SPAWN) &&
						structure.store.getFreeCapacity(resource) > 0;
				}
			});
			
			//prio 2: towers
			prio2 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_TOWER && 
						structure.store.getFreeCapacity(resource) > 10);
				}
			});
		} else {
			//CARRY ANY OTHER RESOURCE TO TERMINAL
			prio1 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
				filter: (structure) => {
					return (structure.structureType == STRUCTURE_TERMINAL &&
						structure.store.getFreeCapacity(resource) > 0);
				}
			});
		}
		
		// Prio 3: Containers, Storage
		var prio3 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
			filter: (structure) => {
				return (structure.structureType == STRUCTURE_STORAGE || 
					(structure.structureType == STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_SOURCES, 2).length == 0 && 
					structure.pos.findInRange(FIND_MINERALS, 2).length == 0)) &&
					structure.store.getFreeCapacity(resource) > 0;
			}
		});
		
		//fast emptying for links
		var fastEmptyOrder = false;
		if (creep.memory.task) {
			if (creep.memory.task.t == "l") {
				fastEmptyOrder = true;
			}
		}
		
		var targets = [];
		
		//fast order or normal order
		if (fastEmptyOrder) {
			if (prio3)
				targets.push(prio3);
			if (prio1)
				targets.push(prio1);
			if (prio2)
				targets.push(prio2);
		} else {
			if (prio1)
				targets.push(prio1);
			if (prio2)
				targets.push(prio2);
			if (prio3)
				targets.push(prio3);
		}
		
		if(targets.length > 0) {
			creep.memory.target = targets[0].id
		}
	}
	
	
	
};


module.exports = roleHauler;