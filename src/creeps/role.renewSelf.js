module.exports = {
	name: 'renewSelf', 
	run: function(creep) {		
        var spawns = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            }
        });
        
        if (spawns.length == 0)
		{
			//no spawn in room - try to go home
			baseCreep.moveToRoom(creep, creep.home.name);
			return;
		} 
		
		//recycle self to build better creep
		if (!creep.memory.killSelf)
		{
			baseCreep.killSelfDecision(creep);
		}
			
	        
		//unboost self
		var index = _.findIndex(creep.body, (s) => s.boost);
		if (index >= 0) {
			var nextlab = creep.pos.findClosestByPath(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_LAB && s.cooldown == 0 });
			if (nextlab) {
				if (nextlab.unboostCreep(creep) == ERR_NOT_IN_RANGE) 
				{
					baseCreep.moveTo(creep, nextlab, {range: 1});
					return;
				}
			}
		}
			
		//carry energy to base
		if (creep.store[RESOURCE_ENERGY] > 0 && creep.room.storage) {
			if(creep.transfer(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				baseCreep.moveTo(creep, creep.room.storage, {range: 1});
				return;
			}
		} 
			
		//renew self vs recycle self
		if (creep.memory.killSelf)
		{
			if (spawns[0].recycleCreep(creep) == ERR_NOT_IN_RANGE)
			{
				baseCreep.moveTo(creep, spawns[0], {range: 1});
			}
			creep.say("☠");
			return;
		} else {
			var ret = spawns[0].renewCreep(creep);
			if (ret == ERR_NOT_IN_RANGE || ret == ERR_BUSY)
			{
				baseCreep.moveTo(creep, spawns[0], {range: 1});
			} else if (ret == ERR_FULL)
			{
				//renew successful
				delete creep.memory.renewSelf;
			}
			creep.say("❤");

			//energy empty
			if (creep.room.energyAvailable < 10)
			{
				delete creep.memory.renewSelf;
			}
		}
	}, 
};