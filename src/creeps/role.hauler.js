
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
			creep.memory.noRenew = true; //no autorenew
		}
				
		if (creep.memory.tasks.length == 0) 
		{
			if (creep.store.getUsedCapacity() > 0) {
				this.confusionDropoff(creep);
				return;
			}
			if (creep.ticksToLive < 200) {
				creep.memory.renewSelf = true;
				return;
			}
            creep.memory.pickup = true;
			
			//pick new task
			creep.memory.tasks = Logistics.getNewTasks(creep.room, creep.store.getCapacity());
			creep.memory.task_ptr = 0;
        }
		
        
		if (creep.memory.tasks.length > 0) 
		{
			var taskmem = creep.memory.tasks[creep.memory.task_ptr];
			var task = Logistics.getTask(creep.room, taskmem.id);
			
			if (!task) {
				this.removeTask(creep, taskmem.id);
				if (creep.memory.task_ptr >= creep.memory.tasks.length) {
					
				}
				return;
			}
			
			//has task - do things
	        if (creep.memory.pickup)
	        {
		        this.pickup(creep, task, taskmem);
	        } 
	        else 
	        {
				this.dropoff(creep, task, taskmem);
		    }
		} 
		else 
		{
			//no task, idle
			creep.say("Zzz");
		}
	}, 
	
	pickup: function(creep, task, taskmem) 
	{
		//source is available check
		var s = Game.getObjectById(task.src);
		if (!s) { 
			console.log(creep.room.name + " " + creep.name + ": source invalid, delete task");
			console.log(JSON.stringify(task));
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
		var amount_avbl = s.amount || s.store[resource];
		var storage_avbl = creep.store.getFreeCapacity();
		var amount = Math.min(amount_avbl, storage_avbl, taskmem.vol);
		
		var ret = null;
		if (s instanceof Resource){
			ret = creep.pickup(s);
		} else {
			ret = creep.withdraw(s, resource, amount);
		}

		if (ret  == ERR_NOT_IN_RANGE) {
			creep.moveTo(s, {visualizePathStyle: {stroke: '#ff0000'}});
		}
		
		
		//successful
		if (ret == OK) {
			taskmem.utx += amount;
			Logistics.markPickup(creep.room, task.id, taskmem.vol, amount);
			this.nextTask(creep, task);

			//creep will be full - switch to dropoff
			if (amount >= storage_avbl) 
			{
				creep.memory.pickup = false;
				this.cancelAllOpenTasks(creep);
			}
		}
		
		//Err - task invalid, not enough resources for transport
		//edit task
		if (ret == ERR_NOT_ENOUGH_RESOURCES) {
			if (amount_avbl == 0) {
				//wait one tick for res to arrive
				if (!taskmem.tick) {
					taskmem.tick = true;
					return;
				}
				
				var new_vol = task.vol - taskmem.vol;
				Logistics.setVolume(creep.room, task.id, new_vol);
				Logistics.markAbort(creep.room, task.id, taskmem.vol);
				taskmem.vol = 0;
				this.removeTask(creep, task.id);
				console.log(creep.room.name + " " + creep.name + ": wrong numbers, edited task " + task.type);
			}
		}
	}, 
	
	
	dropoff: function(creep, task, taskmem) 
	{
		//pick energy receiver
		if (!creep.memory.target) {
			this.pickReceiver(creep, task);
		}
		
		
		var target = Game.getObjectById(creep.memory.target);
		if (target) 
		{
			//move to room
			if (target.room.name != creep.room.name) {
				baseCreep.moveToRoom(creep, target.room.name);
				return;
			}
			
			//select resource for transfer
			var resource = task.res || RESOURCE_ENERGY;
			var amount_avbl = creep.store[resource];
			var storage_avbl = target.store.getFreeCapacity(resource);
			var amount = Math.min(amount_avbl, storage_avbl, taskmem.utx);
			
			//go to target and transfer
			var ret = creep.transfer(target, resource, amount);
			creep.say(ret);
			
			if(ret == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
			}
			
			//target full - search new target
			if (storage_avbl == 0 || ret == ERR_INVALID_TARGET) {
				delete creep.memory.target;
			}
			
			//transfer complete - search new target
			if (ret == OK) 
			{
				Logistics.markDropoff(creep.room, task.id, amount);
				delete creep.memory.target;
				
				if (task.rec != null) {
					this.removeTask(creep, task.id);
				}
				
				//creep will be empty in next tick
				if (storage_avbl >= amount_avbl) {
					creep.memory.pickup = true;
					creep.memory.tasks = [];
					//console.log(creep.room.name + " " + creep.name + ": Creep empty, looking for new tasks");
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
			creep.say("??");
			
		}
	}, 


	pickReceiver: function(creep, task) {
		//first pick task receiver
		let taskrec = Game.getObjectById(task.rec);
		if (taskrec) {
			if (taskrec.store.getFreeCapacity(task.res) > 0) {
				creep.memory.target = taskrec.id;
				return;
			}
		}
		
		
		var target = null;
		
		if (task.res == RESOURCE_ENERGY) 
		{
			//CARRY ENERGY TO PRIORITY TARGETS
			// Prio 1: SPAWNS, Extensions
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType == STRUCTURE_EXTENSION ||
							structure.structureType == STRUCTURE_SPAWN) &&
							structure.store.getFreeCapacity(task.res) > 0;
					}
				});
			}
			
			//prio 2: towers
			if (!target) {
				target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
					filter: (structure) => {
						return (structure.structureType == STRUCTURE_TOWER && 
							structure.store.getFreeCapacity(task.res) > 50);
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
							structure.store.getFreeCapacity(task.res) > 0;
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
							structure.store.getFreeCapacity(task.res) > 0);
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
							structure.store.getFreeCapacity(task.res) > 0;
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
		var index = _.findIndex(creep.memory.tasks, (s) => s.id == taskid);
		if (index >= 0) {
			creep.memory.tasks.splice(index, 1);
		}
	}, 
	
	nextTask: function(creep, task)
	{
		creep.memory.task_ptr++;
		if (creep.memory.task_ptr >= creep.memory.tasks.length) {
			creep.memory.pickup = !creep.memory.pickup;
			creep.memory.task_ptr = 0;
		}
	},
	
	cancelAllOpenTasks: function(creep)
	{
		for (var i in creep.memory.tasks) {
			var taskmem = creep.memory.tasks[i];
			
			//all tasks not started
			if (taskmem.vol > 0 && taskmem.utx == 0)
			{
				Logistics.markCancel(creep.room, taskmem.id, taskmem.vol);
				taskmem.vol = 0;
			}
		}
		
		this.removeEmptyTasks(creep);
	}, 
	
	removeEmptyTasks: function(creep)
	{
		_.remove(creep.memory.tasks, (s) => s.vol == 0 && s.utx == 0);
	}, 
	
	
	confusionDropoff: function(creep)
	{
		var target = creep.room.storage || creep.room.terminal;
		if (target) {
			var res_types = baseCreep.getStoredResourceTypes(creep.store);
			creep.transfer(target, res_types[0]);
			creep.moveTo(target);
		}
	},
	
	
	
};