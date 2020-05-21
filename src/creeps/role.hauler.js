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
		if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0 || 
			!creep.memory.task) {
            creep.memory.harvesting = true;
			delete creep.memory.target;
			
			//pick new task
			creep.memory.task = moduleLogistics.getTask(creep.room, creep.store.getCapacity());
			//if (creep.memory.task)
			//console.log(creep.name + " picking " + creep.memory.task.t + "/" + creep.store.getCapacity());
        }
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {
            creep.memory.harvesting = false;
			delete creep.memory.target;
			
			//finish task
			moduleLogistics.dropTask(creep.room, creep.memory.task, creep.store.getCapacity());
			creep.memory.task.s = null;
			//console.log(creep.name + " dropping " + creep.memory.task.t + "/" + creep.store.getCapacity());
        }
        
        if (creep.memory.harvesting && creep.memory.task)
        {
	        var s = Game.getObjectById(creep.memory.task.s);
	        if (!s) { 
				delete creep.memory.task; 
				return; 
			}
			var amount = s.amount || s.store[RESOURCE_ENERGY];
			
			var ret = null;
			if (s instanceof Resource){
				ret = creep.pickup(s);
			} else {
				ret = creep.withdraw(s, RESOURCE_ENERGY);
			}
			
	        if (ret  == ERR_NOT_IN_RANGE) {
		    	creep.moveTo(s, {visualizePathStyle: {stroke: '#ff0000'}});
	        }
	        
	        //no more energy in container - stop and carry to base
	        if (amount < creep.store.getFreeCapacity() && ret == OK || amount == 0)
	        {
		        creep.memory.harvesting = false;
				moduleLogistics.deleteTask(creep.room, creep.memory.task);
				//console.log(creep.name + " deleting " + creep.memory.task.t);
	        }
        } 
        else 
        {
			//pick energy receiver
	        if (!creep.memory.target) {
				roleHauler.pickEnergyReceiver(creep);
			}
			
	        
	        var target = Game.getObjectById(creep.memory.target);
	        if (target) 
			{
				//target valid - go to target and transfer
				var ret = creep.transfer(target, RESOURCE_ENERGY);
				if(ret == ERR_NOT_IN_RANGE) {
					creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
				}
				//target full - search new target
				if (target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
					delete creep.memory.target;
				}
				//target will be full i next tick
				if (ret == OK) {
					if (target.store.getFreeCapacity(RESOURCE_ENERGY) <= creep.store[RESOURCE_ENERGY]) {
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
	    }
	}, 


	pickEnergyReceiver: function(creep) {
		// Prio 1: SPAWNS, Extensions
		var prio1 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
			filter: (structure) => {
				return (structure.structureType == STRUCTURE_EXTENSION ||
					structure.structureType == STRUCTURE_SPAWN) &&
					structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
			}
		});
		
		//prio 2: towers
		var prio2 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
			filter: (structure) => {
				return (structure.structureType == STRUCTURE_TOWER && 
					structure.store.getFreeCapacity(RESOURCE_ENERGY) > 10);
			}
		});
		
		// Prio 3: Containers, Storage
		var prio3 = creep.pos.findClosestByPath(FIND_STRUCTURES, {
			filter: (structure) => {
				return (structure.structureType == STRUCTURE_STORAGE || 
					(structure.structureType == STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_SOURCES, 2).length == 0)) &&
					structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
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