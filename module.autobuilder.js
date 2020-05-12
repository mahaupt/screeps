var moduleAutobuilder = {
    run: function(room) {
	    if (Game.time % 100 != 0) return;
	    
	    //build spawn
	    
	    // build 5 extensions
	    if (room.controller.level >= 2)
	    {
		    var build = room.find(FIND_MY_STRUCTURES, {
				    filter: { structureType: STRUCTURE_EXTENSION }
				});
			var constr = room.find(FIND_MY_CONSTRUCTION_SITES, {
				    filter: { structureType: STRUCTURE_EXTENSION }
				});
			var extensions = build.length + constr.length;
			
		    if (extensions < 5)
		    {
			    //rooms.createConstructionSite(10, 15, STRUCTURE_EXTENSION);
		    }
	    }
    }
}

module.exports = moduleAutobuilder;
