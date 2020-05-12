var moduleAutobuilder = {
    run: function(room) {
	    if (Game.time % 200 != 0) return;
	    
	    var spawn_num = getTotalStructures(room, STRUCTURE_SPAWN);
	    var spawn_max = 1;
	    
	    var extensions_num = getTotalStructures(room, STRUCTURE_EXTENSION);
	    var extensions_max = 0;
	    if (room.controller.level >= 2) {
		    extensions_max = 5;
	    }
	    
	    //todo: build missing strutures
    }
    
    
    
    getTotalStructures: function(room, type) {
	    var structures = room.find(FIND_MY_STRUCTURES, {
			    filter: { structureType: type }
			});
		var constr = room.find(FIND_MY_CONSTRUCTION_SITES, {
			    filter: { structureType: type }
			});
			
		return structures.length + constr.length;
    }
}

module.exports = moduleAutobuilder;
