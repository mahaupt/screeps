var moduleAutobuilder = {
    run: function(room) {
        //Base building calculation
        if (Memory.pickingBaseLocation) {
            moduleAutobuilder.pickFirstBasePos(room);
            return;
        }
        
        //slow down for cpu savings
	    if (Game.time % 51 != 0) return;
        
        
	    var constr_sites_num = room.find(FIND_MY_CONSTRUCTION_SITES).length;
	    
	    //SPAWN - no autobuild
	    var spawn_num = moduleAutobuilder.getTotalStructures(room, STRUCTURE_SPAWN);
	    var spawn_max = 1;
        if (spawn_num == 0) {
            //moduleAutobuilder.pickFirstBasePos(room);
            return;
        } else if (spawn_num < spawn_max) {
            //todo: additional spawns
        }
	    
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
                    
                    //bugfix, dont build road on controller
                    //it strangely needs 25k to complete
                    if (t instanceof StructureController) {
                        path.pop();
                    }
                    
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
	        var buildPos = moduleAutobuilder.getNextFreeBasePos(room, type, spawns[0].pos);
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
			    
                var tpos = new RoomPosition(pos.x+dx, pos.y+dy, room.name);
                
			    if (moduleAutobuilder.checkPositionFree(room, tpos)) {
                    return tpos;
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
    
    
    checkPositionFree: function(room, pos)
    {
        var target = room.lookAt(pos);
        if (target[0]['type'] == 'terrain')
        {
            if (target[0]['terrain'] == 'plain')
            {
                return true;
            }
        }
        return false;
    }, 
    
    
    getNextFreeBasePos: function(room, type, centerPos)
    {
        var deltas = moduleAutobuilder.getPositionDeltas(type);
        for (var i=0; i < deltas.length; i++)
        {
            var p1 = new RoomPosition(centerPos.x+deltas[i].x, centerPos.y-deltas[i].y, room.name);
            var p2 = new RoomPosition(centerPos.x+deltas[i].x, centerPos.y+deltas[i].y, room.name);
            var p3 = new RoomPosition(centerPos.x-deltas[i].x, centerPos.y+deltas[i].y, room.name);
            var p4 = new RoomPosition(centerPos.x-deltas[i].x, centerPos.y-deltas[i].y, room.name);
            
            if (moduleAutobuilder.checkPositionFree(room, p1)) {
                return p1;
            }
            if (moduleAutobuilder.checkPositionFree(room, p2)) {
                return p2;
            }
            if (moduleAutobuilder.checkPositionFree(room, p3)) {
                return p3;
            }
            if (moduleAutobuilder.checkPositionFree(room, p4)) {
                return p4;
            }
        }
    }, 
    
    //todo: add predefined layout
    getPositionDeltas: function(type)
    {
        var positions = {};
        
        //extensions
        positions[STRUCTURE_EXTENSION] = [
            {x: 1,y: 2}, {x: 1,y: 3},
            {x: 2,y: 2}, {x: 2,y: 3},
            
            {x: 1,y: 5}, {x: 1,y: 6},
            {x: 2,y: 5}, {x: 2,y: 6},
            
            {x: 4,y: 2}, {x: 4,y: 3},
            {x: 5,y: 2}, {x: 5,y: 3},
            
            {x: 4,y: 5}, {x: 4,y: 6},
            {x: 5,y: 5}, {x: 5,y: 6},
        ];
        
        positions[STRUCTURE_CONTAINER] = [
            {x:2, y:0}, {x:3, y:0}
        ];
        
        positions[STRUCTURE_STORAGE] = [
            {x:1, y:0}
        ];
        
        positions[STRUCTURE_TOWER] = [
            {x:3, y:4}
        ]
        
        positions[STRUCTURE_LINK] = [
            
        ]
        
        
        
        return positions[type];
    },
    
    
    pickFirstBasePos: function(room)
    {
        if (Memory.pickingBaseLocation) {
            //calculation already running in different room
            if (room.name != Memory.pickingBaseRoom) return;
        } else {
            Memory.pickingBaseLocation = true;
            Memory.pickingBaseRoom = room.name;
            Memory.pickingBasePoints = -99999;
            Memory.pickingBasePosX = 0;
            Memory.pickingBasePosY = 0;
            Memory.pickingBaseCalcs = 0;
        }
        
        for (var i=0; i < 10; i++)
        {
            var x = Math.floor(Math.random()*48)+1;
            var y = Math.floor(Math.random()*48)+1;
            var pos = new RoomPosition(x, y, room.name);
            var points = moduleAutobuilder.valueBasePos(room, pos);
            Memory.pickingBaseCalcs++;
            
            if (Memory.pickingBasePoints < points)
            {
                Memory.pickingBasePoints = points;
                Memory.pickingBasePosX = x;
                Memory.pickingBasePosY = y;
            }
        }
        
        //calculated enough
        if (Memory.pickingBaseCalcs >= 1000 || Memory.pickingBasePoints >= -120)
        {
            var x = Memory.pickingBasePosX;
            var y = Memory.pickingBasePosY;
            var pts = Memory.pickingBasePoints;
            var calcs = Memory.pickingBaseCalcs;
            console.log("Picked Spawn Location for Room " + room.name);
            console.log("Building Spawn at " + x + " / " + y);
            console.log("Needed " + calcs + " calcs and got " + pts + " points");
            
            room.createConstructionSite(x, y, STRUCTURE_SPAWN, "cbacon");
            
            //cleanup
            delete Memory.pickingBaseLocation;
            delete Memory.pickingBaseRoom;
            delete Memory.pickingBasePoints;
            delete Memory.pickingBasePosX;
            delete Memory.pickingBasePosY;
            delete Memory.pickingBaseCalcs;
        }
    }, 
    
    
    valueBasePos: function(room, pos)
    {
        var points = 0;
        var baseSize = 7;
        
        //distance to sources
        var sources = room.find(FIND_SOURCES);
        for (var i=0; i < sources.length; i++) {
            var path = pos.findPathTo(sources[i]);
            
            if (!path.length)
            {
                points -= 9999;
            } else {
                points -= Math.pow(path.length, 2)*0.5;
            }
        }
        
        //free positions to build
        var places = room.lookAtArea(
            pos.y-baseSize, 
            pos.x-baseSize, 
            pos.y+baseSize, 
            pos.x+baseSize, 
            true);
        for(var i=0; i < places.length; i++)
        {
            if (places[i].terrain == 'plain')
            {
                points += 1;
            }
            if (places[i].terrain == 'swamp')
            {
                points -= 1;
            }
            if (places[i].terrain == 'wall')
            {
                points -= 15;
            }
        }
        
        //distance to exit
        var exits = [];
        exits.push(pos.findClosestByPath(FIND_EXIT_TOP));
        exits.push(pos.findClosestByPath(FIND_EXIT_RIGHT));
        exits.push(pos.findClosestByPath(FIND_EXIT_BOTTOM));
        exits.push(pos.findClosestByPath(FIND_EXIT_LEFT));
        
        for (var i=0; i < exits.length; i++)
        {
            if (!exits[i]) continue;
            var path = pos.findPathTo(exits[i]);
            
            if (!path.length)
            {
                points += 50*5;
            } else {
                //the longer the better
                points += path.length*5;
            }
        }
        
        return points;
    }
}

module.exports = moduleAutobuilder;
