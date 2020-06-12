
/*
Memory Layout
.role = "hauler"
.pickup = true/false
.renewSelf = true/false
.task = HAULING TASK
.target = target.id
*/

module.exports = {
	name: 'hauler', 
	run: function(creep) {
		baseCreep.init(creep);
		
		if (!creep.memory.tasks) {
			creep.memory.tasks = [];
		}
				
		if (creep.memory.tasks.length == 0) 
		{
            creep.memory.pickup = true;
			
			//pick new task
			creep.memory.tasks = Logistics.getNewTasks(creep.room, creep.store.getCapacity());
			creep.memory.task_ptr = 0;
        }
		
        
		if (creep.memory.tasks.length > 0) 
		{
			var taskid = creep.memory.tasks[creep.memory.task_ptr];
			var task = Logistics.getTask(creep.room, taskid);
			
			//has task - do things
	        if (creep.memory.pickup)
	        {
		        this.pickup(creep, task);
	        } 
	        else 
	        {
				this.dropoff(creep, task);
		    }
		} 
		else 
		{
			//no task, idle
			
		}
	}, 
	
	pickup: function(creep, task) 
	{
		//source is available check
		var s = Game.getObjectById(task.src);
		if (!s) { 
			Logistics.deleteTask(creep.room, task.id);
			this.removeTask(creep, task.id);
			return; 
		}
		
		//travel to room
		if (s.room.name != creep.room.name) {
			baseCreep.moveToRoom(creep, s.room.name);
			return;
		}
		
		//select resource for pickup
		var resource = task.res || RESOURCE_ENERGY;
		var amount = s.amount || s.store[resource];
		var multi_pickup = false;
		if (task.type == "mc" || task.type == "loot") 
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
	
	
	dropoff: function(creep, task) 
	{
		//pick energy receiver
		if (!creep.memory.target) {
			this.pickReceiver(creep);
		}
		
		
		var target = Game.getObjectById(creep.memory.target);
		if (target) 
		{
			//move to room
			if (target.room.name != creep.room.name) {
				baseCreep.moveToRoom(creep, target.room.name);
				return;
			}
			
			//select resource for transfer if target is storage
			var resource = creep.memory.task.res || RESOURCE_ENERGY;
			var stored_resources = baseCreep.getStoredResourceTypes(creep.store);
			var multi_dropoff = false;
			if (target.structureType == STRUCTURE_TERMINAL || 
				target.structureType == STRUCTURE_CONTAINER || 
				target.structureType == STRUCTURE_STORAGE) 
			{
				//multidropoff to terminal or / if there is no terminal / to storage
				multi_dropoff = stored_resources.length > 1;
				resource = stored_resources[0];
			}
			
			//go to target and transfer
			var ret = creep.transfer(target, resource);
			//console.log(creep.name + ":" + ret);
			
			if(ret == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
			}
			//target full - search new target
			if (target.store.getFreeCapacity(resource) == 0 || ret == ERR_INVALID_TARGET) {
				delete creep.memory.target;
			}
			//transfer complete - search new target
			if (ret == OK && !multi_dropoff) {
				delete creep.memory.target;
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
		if (creep.memory.task && creep.memory.task.type == "l") {
			if (creep.room.storage) {
				creep.memory.target = creep.room.storage.id;
				return;
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
							structure.store.getFreeCapacity(resource) > 50);
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
	}, 
	
	removeTask: function(creep, taskid)
	{
		var index = _.findIndex(creep.memory.tasks, (s) => s == taskid);
		if (index >= 0) {
			creep.memory.tasks.splice(index, 1);
		}
	}, 
	
	nextTask: function(creep)
	{
		creep.memory.task_ptr++;
		if (creep.memory.task_ptr >= creep.memory.tasks.length) {
			
		}
	}
	
	
	
};