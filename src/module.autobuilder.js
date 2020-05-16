var moduleAutobuilder = {
    run: function(room) {
	    if (Game.time % 51 != 0) return;
	    var constr_sites_num = room.find(FIND_MY_CONSTRUCTION_SITES).length;
	    
	    //SPAWN - no autobuild
	    //var spawn_num = moduleAutobuilder.getTotalStructures(room, STRUCTURE_SPAWN);
	    //var spawn_max = 1;
	    
	    //EXTENSIONS
	    var extensions_num = moduleAutobuilder.getTotalStructures(room, STRUCTURE_EXTENSION);
	    var extensions_max = 0;
	    if (room.controller.level == 2) {
		    extensions_max = 5;
	    } else if (room.controller.level == 3) {
		    extensions_max = 10;
	    } else if (room.controller.level >= 4) {
		    extensions_max = (room.controller.level-2)*10;
	    }
	    
	    //TOWERS
	    var towers_num = moduleAutobuilder.getTotalStructures(room, STRUCTURE_TOWER);
	    var towers_max = 0;
	    if (room.controller.level >= 3) {
		    towers_max = 1;
		}
		if (room.controller.level >= 5) {
		    towers_max = 2;
		}
		if (room.controller.level >= 7) {
		    towers_max = 3;
		}
		if (room.controller.level == 8) {
		    towers_max = 6;
		}
		
		//CONTAINERS
		var containers_num = moduleAutobuilder.getTotalStructures(room, STRUCTURE_CONTAINER);
		var source_num = room.find(FIND_SOURCES).length;
	    var containers_max = 5;
	    
	    
	    //build spawns - build own
	    
	    //build towers
	    if (towers_num < towers_max)
	    {
		    moduleAutobuilder.buildAroundSpawn(room, STRUCTURE_TOWER);
	    }
	    
	    //build containers
	    if (containers_num < containers_max)
	    {
		    if (containers_num < source_num) {
		    	moduleAutobuilder.buildMiningContainer(room);
		    } else {
			    moduleAutobuilder.buildAroundSpawn(room, STRUCTURE_CONTAINER);
		    }
	    }
	    
	    //build extensions
	    if (extensions_num < extensions_max)
	    {
		    moduleAutobuilder.buildAroundSpawn(room, STRUCTURE_EXTENSION);
	    }
	    
	    //build roads - nothing other to build
	    if (extensions_num > 1 && constr_sites_num == 0)
	    {
		    var spawn = room.find(FIND_STRUCTURES, {
			    filter: { structureType: STRUCTURE_SPAWN }
			});
			var container = room.find(FIND_STRUCTURES, {
			    filter: { structureType: STRUCTURE_CONTAINER }
			});
            var targets = container.concat([room.controller]);
			if (spawn.length > 0 && targets.length > 0)
			{
				var builtRoads = 0;
				
                //roads from spawn to Structures
				for (var t of targets)
				{
					var path = spawn[0].pos.findPathTo(t.pos, {ignoreCreeps: true, ignoreRoads: true});
					for (var i=0; i < path.length; i++)
					{
						if (room.createConstructionSite(path[i].x, path[i].y, STRUCTURE_ROAD) == OK)
						{
							builtRoads++;
						}
					}
					//console.log(builtRoads);
					if (builtRoads > 0) break;	
				}
                
                //roads around spawn
                if (builtRoads == 0) {
                    var sPos = spawn[0].pos;
                    room.createConstructionSite(sPos.x+1, sPos.y+1, STRUCTURE_ROAD);
                    room.createConstructionSite(sPos.x+1, sPos.y, STRUCTURE_ROAD);
                    room.createConstructionSite(sPos.x+1, sPos.y-1, STRUCTURE_ROAD);
                    room.createConstructionSite(sPos.x, sPos.y+1, STRUCTURE_ROAD);
                    room.createConstructionSite(sPos.x, sPos.y-1, STRUCTURE_ROAD);
                    room.createConstructionSite(sPos.x-1, sPos.y+1, STRUCTURE_ROAD);
                    room.createConstructionSite(sPos.x-1, sPos.y, STRUCTURE_ROAD);
                    room.createConstructionSite(sPos.x-1, sPos.y-1, STRUCTURE_ROAD);
                }
			}
	    }
    },
    
    
    buildMiningContainer: function(room) {
	    var sources = room.find(FIND_SOURCES);
	    for (var s of sources)
	    {
		    
		    var cont = s.pos.findInRange(FIND_STRUCTURES, 2, {
		        filter: (structure) => {
		            return structure.structureType == STRUCTURE_CONTAINER;
		        }});
		    var cont_c = s.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 2, {
		        filter: (structure) => {
		            return structure.structureType == STRUCTURE_CONTAINER;
		        }});
		    
		    //console.log("S x" + s.pos.x + " y" + s.pos.y + " - " + (cont.length+cont_c.length));
		    
		    if (cont.length+cont_c.length == 0)
		    {
			    //no container at source yet
			    var spawn = room.find(FIND_MY_STRUCTURES, {
				    filter: { structureType: STRUCTURE_SPAWN }
				});
				if (spawn.length > 0)
				{
					var path = s.pos.findPathTo(spawn[0], {ignoreCreeps:true});	
					if (path.length > 1)
					{
						var buildPos = new RoomPosition(path[0].x, path[0].y, room.name);
						room.createConstructionSite(buildPos, STRUCTURE_CONTAINER);
						//console.log("Container x" + buildPos.x + " y" + buildPos.y);
						return;
					} else {
						console.log("Container Spawn: No place found");
					}
				}
		    }
	    }
    }, 
    
    
    buildAroundSpawn: function(room, type) {
	    var spawns = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            }
        });
        
        //build around spawn 0
        if (spawns.length > 0)
        {
	        var buildPos = moduleAutobuilder.getFreePosNextTo(room, spawns[0].pos);
	        room.createConstructionSite(buildPos, type);
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
	    var structures = room.find(FIND_STRUCTURES, {
			    filter: { structureType: type }
			});
		var constr = room.find(FIND_MY_CONSTRUCTION_SITES, {
			    filter: { structureType: type }
			});
			
		return structures.length + constr.length;
    }, 
    
    //todo: add predefined layout
    getPositionDeltas: function(type)
    {
        var positions = [
            {x: -1,y: -2}
        ];
    }
}

module.exports = moduleAutobuilder;
