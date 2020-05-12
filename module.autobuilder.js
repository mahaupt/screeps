var moduleAutobuilder = {
    run: function(room) {
	    if (Game.time % 51 != 0) return;
	    
	    var spawn_num = moduleAutobuilder.getTotalStructures(room, STRUCTURE_SPAWN);
	    var spawn_max = 1;
	    
	    var extensions_num = moduleAutobuilder.getTotalStructures(room, STRUCTURE_EXTENSION);
	    var extensions_max = 0;
	    if (room.controller.level >= 2) {
		    extensions_max = 5;
	    }
	    
	    //build missing strutures
	    if (extensions_num < extensions_max)
	    {
		    var spawns = room.find(FIND_STRUCTURES, {
	            filter: (structure) => {
	                return structure.structureType == STRUCTURE_SPAWN;
	            }
	        });
	        
	        //build around spawn 0
	        if (spawns.length > 0)
	        {
		        var buildPos = moduleAutobuilder.getFreePosNextTo(room, spawns[0].pos);
		        room.createConstructionSite(buildPos, STRUCTURE_EXTENSION);
	        }
	    }
    }, 
    
    
    getFreePosNextTo: function(room, pos)
    {
	    for (var r=2; r<10; r++) {
		    for (var i=1; i <= 8; i++)
		    {
			    var dx = 0;
			    var dy = 0;
			    if (i==1) { dx =  1*r; dy =  1*r; }
			    if (i==2) { dx =  1*r; dy =  0; }
			    if (i==3) { dx =  1*r; dy = -1*r; }
			    if (i==4) { dx =  0  ; dy =  1*r; }
			    if (i==5) { dx =  0  ; dy = -1*r; }
			    if (i==6) { dx = -1*r; dy =  1*r; }
			    if (i==7) { dx = -1*r; dy =  0; }
			    if (i==8) { dx = -1*r; dy = -1*r; }
			    
			    var target = room.lookAt(pos.x+dx, pos.y+dy);
			    if (target[0]['type'] == 'terrain')
			    {
				    if (target[0]['terrain'] == 'plain')
					{
				    	return new RoomPosition(pos.x+dx, pos.y+dy, room.name);
				    }
			    }
		    }
		}
	    
    }, 
    
    
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
