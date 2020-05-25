/*
Memory Layout
.role = "hauler"
.harvesting = true/false
.renewSelf = true/false
.container = container.id // link.id
.target = target.id
*/

module.exports = {
	name: 'hauler', 
	run: function(creep) {
		baseCreep.init(creep);
				
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
			moduleLogistics.dropTask(
				creep.room, 
				creep.memory.task, 
				creep.store.getCapacity(), 
				creep.store.getCapacity()
			);
			creep.memory.task.s = null;
			
        }
        
		if (creep.memory.task) 
		{
			//has task - do things
	        if (creep.memory.harvesting)
	        {
		        this.pickup(creep);
	        } 
	        else 
	        {
				this.dropoff(creep);
		    }
		} 
		else 
		{
			//no task, idle
			
		}
	}, 
	
	pickup: function(creep) 
	{
		var s = Game.getObjectById(creep.memory.task.s);
		if (!s) { 
			delete creep.memory.task; 
			return; 
		}
		
		//travel to room
		if (s.room.name != creep.room.name) {
			baseCreep.moveToRoom(creep, s.room.name);
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
		if (creep.memory.task.t == "mc" || creep.memory.task.t == "loot") 
		{
			//mining container, pickup all resources
			if (s instanceof Resource) {
				amount = s.amount;
				resource = s.resourceType;
			} else {
				amount = s.store.getUsedCapacity();
				var res_types = baseCreep.getStoredResourceTypes(s.store);
				resource = res_types[0];
				multi_pickup = res_types.length > 1;
			}
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
			this.pickReceiver(creep);
		}
		
		
		var target = Game.getObjectById(creep.memory.target);
		if (target) 
		{
			//select resource for transfer if target is storage
			var resource = RESOURCE_ENERGY;
			var stored_resources = baseCreep.getStoredResourceTypes(creep.store);
			var multi_dropoff = false;
			if (target.structureType == STRUCTURE_TERMINAL || 
				target.structureType == STRUCTURE_CONTAINER || 
				target.structureType == STRUCTURE_STORAGE) 
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
		
		var target = null;
		
		//if quick purge - select storage if avbl
		if (creep.memory.task) {
			if (creep.memory.task.t == "l") {
				if (creep.room.storage) {
					creep.memory.target = creep.room.storage.id;
					return;
				}
			}
		}
		
		
		if (resource == RESOURCE_ENERGY) 
		{
			//CARRY ENERGY TO PRIORITY TARGETS
			// Prio 1: SPAWNS, Extensions
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType == STRUCTURE_EXTENSION ||
							structure.structureType == STRUCTURE_SPAWN) &&
							structure.store.getFreeCapacity(resource) > 0;
					}
				});
			}
			
			//prio 2: towers
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType == STRUCTURE_TOWER && 
							structure.store.getFreeCapacity(resource) > 10);
					}
				});
			}
			
			//prio 3: containers, Storage
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType == STRUCTURE_STORAGE || 
							(structure.structureType == STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_SOURCES, 2).length == 0 && 
							structure.pos.findInRange(FIND_MINERALS, 2).length == 0)) &&
							structure.store.getFreeCapacity(resource) > 0;
					}
				});
			}
				
		} 
		else //OTHER RESOURCES
		{
			//CARRY ANY OTHER RESOURCE TO TERMINAL
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType == STRUCTURE_TERMINAL &&
							structure.store.getFreeCapacity(resource) > 0);
					}
				});
			}
			
			//or else to storages
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType == STRUCTURE_STORAGE || 
							(structure.structureType == STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_SOURCES, 2).length == 0 && 
							structure.pos.findInRange(FIND_MINERALS, 2).length == 0)) &&
							structure.store.getFreeCapacity(resource) > 0;
					}
				});
			}
		}
		
		if(target) {
			creep.memory.target = target.id
		}
	}
	
	
	
};