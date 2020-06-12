module.exports = {
    run: function(room) {        
	    var constr_sites_num = room.find(FIND_MY_CONSTRUCTION_SITES).length;
	    
	    //SPAWN
	    var spawn_num = this.getTotalStructures(room, STRUCTURE_SPAWN);
        var spawn_built = this.getTotalStructures(room, STRUCTURE_SPAWN, true);
	    var spawn_max = 1;
        if (spawn_num < spawn_max) {
            var cpoint = this.getBaseCenterPoint(room);
            if (cpoint) 
            {
                //center point avbl for build
                this.buildAroundCenter(room, STRUCTURE_SPAWN, true);
            }
            return;
        }
        
        //no spawn - abort autobuild
        if (spawn_built == 0) return;
	    
	    //EXTENSIONS
	    var extensions_num = this.getTotalStructures(room, STRUCTURE_EXTENSION);
	    var extensions_max = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
	    
        if (extensions_num < extensions_max && constr_sites_num < 2)
	    {
		    if (this.buildAroundCenter(room, STRUCTURE_EXTENSION, true)) {
                constr_sites_num++;
            }
	    }
	    
	    //TOWERS
	    var towers_num = this.getTotalStructures(room, STRUCTURE_TOWER);
	    var towers_max = CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level];
        
        if (towers_num < towers_max && constr_sites_num < 2)
	    {
		    if (this.buildAroundCenter(room, STRUCTURE_TOWER, true)) {
                constr_sites_num++;
            }
	    }
		
		//CONTAINERS
		var containers_num = this.getTotalStructures(room, STRUCTURE_CONTAINER);
		var source_num = room.find(FIND_SOURCES).length;
        var mineral_num = room.find(FIND_MINERALS).length;
	    var containers_max = 5;
        
	    if (containers_num < containers_max && extensions_num >= 4 && constr_sites_num < 2)
	    {
		    if (containers_num < source_num) {
		    	if (this.buildMiningStructure(room, STRUCTURE_CONTAINER, 0)) {
                    constr_sites_num++;
                }
            } else if (containers_num < containers_max-mineral_num) {
			    if (this.buildAroundCenter(room, STRUCTURE_CONTAINER, false)) {
                    constr_sites_num++;
                }
		    } else if (room.controller.level >= 6 && mineral_num >= 1) {
                //build container at 
                if (this.buildMiningStructure(room, STRUCTURE_CONTAINER, 0)) {
                    constr_sites_num++;
                }
            }
	    }
        
        //Storage
        var storage_num = this.getTotalStructures(room, STRUCTURE_STORAGE);
        var storage_max = CONTROLLER_STRUCTURES[STRUCTURE_STORAGE][room.controller.level];
        
        if (storage_num < storage_max && constr_sites_num < 2)
        {
            if (this.buildAroundCenter(room, STRUCTURE_STORAGE, true)) {
                constr_sites_num++;
            }
        }
        
        //Links
        var links_num = this.getTotalStructures(room, STRUCTURE_LINK);
        var links_max = CONTROLLER_STRUCTURES[STRUCTURE_LINK][room.controller.level];
        
        if (links_num < links_max && constr_sites_num < 2)
        {
            //build base link
            if (links_num == 0) {
                if (this.buildAroundCenter(room, STRUCTURE_LINK, true)) {
                    constr_sites_num++;
                }
            } else {
                //build mining links
                if (links_num-1 < source_num)
                {
                    //todo - look 
                    if (this.buildMiningStructure(room, STRUCTURE_LINK, 1)) {
                        constr_sites_num++;
                    }
                }
            }
        }
        
        
        //Extractor
        var extractor_num = this.getTotalStructures(room, STRUCTURE_EXTRACTOR);
        var extractor_max = CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][room.controller.level];
        if (extractor_num < extractor_max && constr_sites_num < 2) 
        {
            var minerals = room.find(FIND_MINERALS);
            if (minerals.length > 0) {
                if (room.createConstructionSite(minerals[0].pos, STRUCTURE_EXTRACTOR) == OK)
                {
                    constr_sites_num++;
                }
            }
        }
        
        //Terminal
        var terminal_num = this.getTotalStructures(room, STRUCTURE_TERMINAL);
        var terminal_max = CONTROLLER_STRUCTURES[STRUCTURE_TERMINAL][room.controller.level];
        if (terminal_num < terminal_max && constr_sites_num < 2) 
        {
            if (this.buildAroundCenter(room, STRUCTURE_TERMINAL, true)) {
                constr_sites_num++;
            }
        }
        
        //labs
        var lab_num = this.getTotalStructures(room, STRUCTURE_LAB);
        var lab_max = CONTROLLER_STRUCTURES[STRUCTURE_LAB][room.controller.level];
        if (lab_num < lab_max) {
            if (this.buildAroundCenter(room, STRUCTURE_LAB, true)) {
                constr_sites_num++;
            }
        }
        
	    
	    //build roads - nothing other to build
	    if (containers_num > 1 && constr_sites_num == 0)
	    {
		    this.buildRoads(room);
	    }
        
        //building walls from lvl 4
        if (room.controller.level >= 4 && constr_sites_num == 0) {
            //this.buildAroundCenter(room, STRUCTURE_RAMPART, false);
            //this.buildAroundCenter(room, STRUCTURE_WALL, true);
        }
    },
    
    
    buildMiningStructure: function(room, type, steps_from_source=0) {
        var validPositions = [];
        
        //first - pick valid build positions
	    var sources = room.find(FIND_SOURCES);
        if (room.controller.level >= 6 && type != STRUCTURE_LINK) {
            sources = sources.concat(room.find(FIND_MINERALS));
        }
        
	    for (var s of sources)
	    {
		    
		    var cont = s.pos.findInRange(FIND_STRUCTURES, 2, {
		        filter: (s) => {
		            return s.structureType == type;
		        }});
		    var cont_c = s.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 2, {
		        filter: (s) => {
		            return s.structureType == type;
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
						var buildPos = new RoomPosition(
                            path[steps_from_source].x, 
                            path[steps_from_source].y, 
                            room.name);
                        validPositions.push({pos: buildPos, dist: path.length});
					} else {
						console.log("Mining Structure Spawn: No place found");
					}
				}
		    }
	    }
        
        //build at position most far away first
        validPositions = _.sortBy(validPositions, s => -s.dist);
        if (validPositions.length > 0) {
            if (room.createConstructionSite(validPositions[0].pos, type) == OK) {
                return true;
            }
        }
        
        return false;
    }, 
    
    
    buildAroundCenter: function(room, type, removeRoads=false) {
	    
        var centerPos = this.getBaseCenterPoint(room);
        var buildPos = this.getNextFreeBasePos(room, type, centerPos);
        if (!centerPos || !buildPos) return false;
        
        if (room.createConstructionSite(buildPos, type) == OK) {
            if (removeRoads) {
                this.removeRoads(room, buildPos);
            }
            return true;
        }

        return false;
    }, 
    
    
    getTotalStructures: function(room, type, ignore_csites=false) {
	    var structures = room.find(FIND_STRUCTURES, {
			    filter: { structureType: type }
			});
		
        if (ignore_csites) {
            return structures.length;
        } else {
            var constr = room.find(FIND_MY_CONSTRUCTION_SITES, {
    			    filter: { structureType: type }
    			});
            return structures.length + constr.length;
        }
    }, 
    
    
    checkPositionFree: function(room, pos, ignoreRoads=true)
    {
        var target = room.lookAt(pos);
        var buildable = true;
        
        for (var i = 0; i < target.length; i++)
        {
            //terrain not plain
            if (target[i].type == 'terrain')
            {
                if (target[i].terrain != 'plain' && 
                    target[i].terrain != 'swamp')
                {
                    return false;
                }
            }
            
            //structure not road
            if (target[i].type == 'structure')
            {
                if (!(target[i].structure instanceof StructureRoad) || !ignoreRoads)
                {
                    return false;
                }
            }
        }
        
        //check for construction sites
        var csites = pos.findInRange(FIND_CONSTRUCTION_SITES, 0);
        if (csites.length > 0) return false;

        return buildable;
    }, 
    
    getNextFreeBasePos: function(room, type, centerPos)
    {
        var deltas = this.getPositionDeltas(type);
        for (var i=0; i < deltas.length; i++)
        {
            var p = new RoomPosition(centerPos.x+deltas[i].x, centerPos.y-deltas[i].y, room.name);

            var ignoreRoads = type != STRUCTURE_ROAD;
            
            if (this.checkPositionFree(room, p, ignoreRoads)) {
                return p;
            }
        }
        return undefined;
    },
    
    getBaseCenterPoint: function(room)
    {
        if (!room.memory.center) {
            if (!this.calcBaseCenterPoint(room)) {
                return undefined;
            }
        }
        return new RoomPosition(room.memory.center.x, room.memory.center.y, room.name);
    }, 
    
    calcBaseCenterPoint: function(room)
    {
        //calc from first spawn
        var spawns = room.find(
            FIND_MY_STRUCTURES, 
            {filter: (s) => s.structureType == STRUCTURE_SPAWN}
        );
        if (spawns.length > 0) {
            room.memory.center = {x: spawns[0].pos.x-1, y: spawns[0].pos.y+6};
            return true;
        }
        
        //find Base flag
        var bflags = room.find(FIND_FLAGS, {filter: (s) => s.name.search("Base")==0});
        if (bflags.length > 0) {
            room.memory.center = {x: bflags[0].pos.x, y: bflags[0].pos.y};
            bflags[0].remove();
            return true;
        }
        
        //take calculated base pos
        var cbpos = Intel.getPotClaimCenterPos(room.name);
        if (cbpos) {
            room.memory.center = {x: cbpos.x, y: cbpos.y};
            return true;
        }
        
        return false;
    }, 
    
    getPositionDeltas: function(type)
    {
        var positions = {};
        
        
        positions[STRUCTURE_SPAWN] = [
            {x:1, y:6}, {x:1, y:-6},
        ];
        
        //extensions
        positions[STRUCTURE_EXTENSION] = [
            {x:3, y:2}, {x:4, y:2}, {x:4, y:3}, {x:5, y:3}, {x:5, y:4}, {x:6, y:4}, {x:6, y:5}, 
            {x:2, y:3}, {x:2, y:4}, {x:3, y:4}, {x:3, y:5}, {x:4, y:5}, {x:4, y:6}, {x:5, y:6}, 
            
            {x:3, y:-2}, {x:4, y:-2}, {x:4, y:-3}, {x:5, y:-3}, {x:5, y:-4}, {x:6, y:-4}, {x:6, y:-5}, 
            {x:2, y:-3}, {x:2, y:-4}, {x:3, y:-4}, {x:3, y:-5}, {x:4, y:-5}, {x:4, y:-6}, {x:5, y:-6}, 
            
            {x:-3, y:2}, {x:-4, y:2}, {x:-4, y:3}, {x:-5, y:3}, {x:-5, y:4}, {x:-6, y:4}, {x:-6, y:5}, 
            {x:-2, y:3}, {x:-2, y:4}, {x:-3, y:4}, {x:-3, y:5}, {x:-4, y:5}, {x:-4, y:6}, {x:-5, y:6},
            
            {x:-1, y:3}, {x:1, y:3}, {x:-1, y:4}, {x:1, y:4}, {x:-1, y:5}, {x:1, y:5},  
            {x:-1, y:-3}, {x:1, y:-3}, {x:-1, y:-4}, {x:1, y:-4}, {x:-1, y:-5}, {x:1, y:-5}, 
            
            {x:4, y:1}, {x:4, y:-1}, {x:5, y:1}, {x:5, y:-1}, 
            {x:-4, y:1}, {x:-4, y:-1}, {x:-5, y:1}, {x:-5, y:-1}, 
        ];
        
        positions[STRUCTURE_CONTAINER] = [
            {x:-6, y:-1}, {x:6, y:-1}
        ];
        
        positions[STRUCTURE_STORAGE] = [
            {x:0, y:-1}
        ];
        
        positions[STRUCTURE_TERMINAL] = [
            {x:-1, y:-1}
        ];
        
        positions[STRUCTURE_TOWER] = [
            {x:-1, y:0}, {x:1, y:0},
            {x:-3, y:1}, {x:3, y:1}, 
            {x:-3, y:-1}, {x:3, y:-1},
        ];
        
        positions[STRUCTURE_LINK] = [
            {x:0, y:1}
        ];
        
        positions[STRUCTURE_LAB] = [
            {x:-3, y:-2}, {x:-4, y:-2}, {x:-4, y:-3}, {x:-5, y:-3}, {x:-5, y:-4}, 
            {x:-2, y:-3}, {x:-2, y:-4}, {x:-3, y:-4}, {x:-3, y:-5}, {x:-4, y:-5}
        ];
        
        positions[STRUCTURE_ROAD] = [
            {x:0, y:0}, 
            {x:-1, y:1}, {x:-2, y:2}, {x:-3, y:3}, {x:-4, y:4}, {x:-5, y:5}, {x:-6, y:6}, 
            {x:1, y:-1}, {x:2, y:-2}, {x:3, y:-3}, {x:4, y:-4}, {x:5, y:-5}, {x:6, y:-6}, 
            {x:2, y:2}, {x:3, y:3}, {x:4, y:4}, {x:5, y:5}, {x:6, y:6}, 
            {x:-2, y:-2}, {x:-3, y:-3}, {x:-4, y:-4}, {x:-5, y:-5}, {x:-6, y:-6}, 
            {x:0, y:2}, {x:0, y:3}, {x:0, y:4}, {x:0, y:5}, {x:0, y:6}, 
            {x:0, y:-2}, {x:0, y:-3}, {x:0, y:-4}, {x:0, y:-5}, {x:0, y:-6}, 
            {x:2, y:0}, {x:3, y:0}, {x:4, y:0}, {x:5, y:0}, {x:6, y:0}, 
            {x:-2, y:0}, {x:-3, y:0}, {x:-4, y:0}, {x:-5, y:0}, {x:-6, y:0},
        ];
        
        positions[STRUCTURE_RAMPART] = [
            {x: 0, y: 9},
            {x: 2, y: 9}, {x: 4, y: 9}, {x: 6, y: 9}, {x: 8, y: 9}, 
            {x: -2, y: 9}, {x: -4, y: 9}, {x: -6, y: 9}, {x: -8, y: 9}, 
            
            {x: 0, y: -9}, 
            {x: 2, y: -9}, {x: 4, y: -9}, {x: 6, y: -9}, {x: 8, y: -9}, 
            {x: -2, y: -9}, {x: -4, y: -9}, {x: -6, y: -9}, {x: -8, y: -9}, 
            
            {x: 9, y: 0},
            {x: 9, y: 2}, {x: 9, y: 4}, {x: 9, y: 6}, {x: 9, y: 8}, 
            {x: 9, y: -2}, {x: 9, y: -4}, {x: 9, y: -6}, {x: 9, y: -8}, 
            
            {x: -9, y: 0},
            {x: -9, y: 2}, {x: -9, y: 4}, {x: -9, y: 6}, {x: -9, y: 8}, 
            {x: -9, y: -2}, {x: -9, y: -4}, {x: -9, y: -6}, {x: -9, y: -8}, 
        ];
        
        positions[STRUCTURE_WALL] = [
            {x: 1, y: 9}, {x: 3, y: 9}, {x: 5, y: 9}, {x: 7, y: 9}, {x: 9, y: 9},
            {x: -1, y: 9}, {x: -3, y: 9}, {x: -5, y: 9}, {x: -7, y: 9}, {x: -9, y: 9}, 
            
            {x: 1, y: -9}, {x: 3, y: -9}, {x: 5, y: -9}, {x: 7, y: -9}, {x: 9, y: -9},
            {x: -1, y: -9}, {x: -3, y: -9}, {x: -5, y: -9}, {x: -7, y: -9}, {x: -9, y: -9}, 
            
            {x: 9, y: 1}, {x: 9, y: 3}, {x: 9, y: 5}, {x: 9, y: 7}, {x: 9, y: 9}, 
            {x: 9, y: -1}, {x: 9, y: -3}, {x: 9, y: -5}, {x: 9, y: -7}, {x: 9, y: -9}, 
            
            {x: -9, y: 1}, {x: -9, y: 3}, {x: -9, y: 5}, {x: -9, y: 7}, {x: -9, y: 9}, 
            {x: -9, y: -1}, {x: -9, y: -3}, {x: -9, y: -5}, {x: -9, y: -7}, {x: -9, y: -9}, 
        ];
        
        
        return positions[type];
    },
    
    removeRoads: function(room, pos)
    {
        var roads = pos.findInRange(FIND_STRUCTURES, 0, {filter: (s) => {
            return s.structureType == STRUCTURE_ROAD;
        }});
        
        if (roads.length > 0)
        {
            roads[0].destroy();
        }
    }, 
    
    
    buildRoads: function(room)
    {
        var container = room.find(FIND_STRUCTURES, {
            filter: (s) => { 
                return s.structureType == STRUCTURE_CONTAINER || 
                    s.structureType == STRUCTURE_EXTRACTOR; 
            }
        });
        var targets = container.concat([room.controller]);
        if (targets.length > 0)
        {
            var centerPos = this.getBaseCenterPoint(room);
            var builtRoads = 0;
            
            //roads from spawn to Structures
            for (var t of targets)
            {
                var path = centerPos.findPathTo(t.pos, {ignoreCreeps: true});
                
                //bugfix, dont build road on controller
                //it strangely needs 25k to complete
                if (!(t instanceof StructureContainer)) {
                    path.pop();
                }
                
                for (var i=0; i < path.length && builtRoads < 5; i++)
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
                    this.buildAroundCenter(room, STRUCTURE_ROAD, false);
            }
        }
    }
};
