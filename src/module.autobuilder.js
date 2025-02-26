module.exports = {
    template_center: {"x":25,"y":26},
    template: {"name":"","shard":"shard0","rcl":8,"buildings":{"spawn":{"pos":[{"x":24,"y":25},{"x":26,"y":25},{"x":31,"y":31}]},"storage":{"pos":[{"x":25,"y":27}]},"link":{"pos":[{"x":25,"y":25}]},"terminal":{"pos":[{"x":24,"y":27}]},"factory":{"pos":[{"x":26,"y":27}]},"tower":{"pos":[{"x":24,"y":26},{"x":26,"y":26},{"x":24,"y":20},{"x":24,"y":32},{"x":26,"y":20},{"x":26,"y":32}]},"road":{"pos":[{"x":24,"y":24},{"x":26,"y":24},{"x":27,"y":24},{"x":25,"y":24},{"x":23,"y":25},{"x":23,"y":26},{"x":23,"y":27},{"x":23,"y":28},{"x":25,"y":28},{"x":26,"y":28},{"x":27,"y":28},{"x":27,"y":27},{"x":27,"y":26},{"x":27,"y":25},{"x":24,"y":28},{"x":23,"y":24},{"x":22,"y":23},{"x":21,"y":22},{"x":20,"y":21},{"x":28,"y":23},{"x":29,"y":22},{"x":30,"y":21},{"x":28,"y":29},{"x":29,"y":30},{"x":30,"y":31},{"x":22,"y":29},{"x":21,"y":30},{"x":20,"y":31},{"x":25,"y":23},{"x":25,"y":22},{"x":25,"y":21},{"x":28,"y":26},{"x":29,"y":26},{"x":30,"y":26},{"x":31,"y":26},{"x":22,"y":26},{"x":21,"y":26},{"x":20,"y":26},{"x":25,"y":29},{"x":25,"y":30},{"x":25,"y":31},{"x":25,"y":32},{"x":19,"y":26},{"x":25,"y":20},{"x":31,"y":20},{"x":31,"y":32},{"x":19,"y":32},{"x":19,"y":20}]},"extension":{"pos":[{"x":26,"y":23},{"x":27,"y":23},{"x":27,"y":22},{"x":28,"y":22},{"x":28,"y":21},{"x":29,"y":21},{"x":29,"y":20},{"x":30,"y":20},{"x":28,"y":25},{"x":28,"y":24},{"x":29,"y":24},{"x":29,"y":23},{"x":30,"y":23},{"x":30,"y":22},{"x":31,"y":22},{"x":31,"y":21},{"x":24,"y":23},{"x":23,"y":23},{"x":23,"y":22},{"x":22,"y":22},{"x":22,"y":21},{"x":21,"y":21},{"x":21,"y":20},{"x":20,"y":20},{"x":22,"y":25},{"x":22,"y":24},{"x":21,"y":24},{"x":21,"y":23},{"x":20,"y":23},{"x":20,"y":22},{"x":19,"y":22},{"x":19,"y":21},{"x":28,"y":27},{"x":28,"y":28},{"x":29,"y":28},{"x":29,"y":29},{"x":30,"y":29},{"x":30,"y":30},{"x":31,"y":30},{"x":26,"y":29},{"x":27,"y":29},{"x":27,"y":30},{"x":28,"y":30},{"x":28,"y":31},{"x":29,"y":31},{"x":29,"y":32},{"x":26,"y":22},{"x":26,"y":21},{"x":24,"y":21},{"x":24,"y":22},{"x":22,"y":27},{"x":21,"y":27},{"x":21,"y":25},{"x":20,"y":25},{"x":20,"y":27},{"x":29,"y":25},{"x":29,"y":27},{"x":30,"y":25},{"x":30,"y":27},{"x":24,"y":29}]},"lab":{"pos":[{"x":23,"y":29},{"x":22,"y":30},{"x":23,"y":30},{"x":21,"y":31},{"x":22,"y":31},{"x":22,"y":28},{"x":21,"y":28},{"x":21,"y":29},{"x":20,"y":29},{"x":20,"y":30}]},"observer":{"pos":[{"x":31,"y":25}]},"powerSpawn":{"pos":[{"x":31,"y":27}]},"nuker":{"pos":[{"x":19,"y":25}]},"container":{"pos":[{"x":19,"y":27},{"x":30,"y":32}]}}},

    run: function(room) {        
	    var constr_sites_num = room.find(FIND_MY_CONSTRUCTION_SITES).length;
	    
	    //SPAWN
	    var spawn_num = this.getTotalStructures(room, STRUCTURE_SPAWN);
        var spawn_built = this.getTotalStructures(room, STRUCTURE_SPAWN, true);
	    var spawn_max = CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][room.controller.level];
        if (spawn_num < spawn_max) {
            if (this.buildAroundCenter(room, STRUCTURE_SPAWN, true)) {
                constr_sites_num++;
            }
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
		var source_num = room.sources.length;
        var mineral_num = room.mineral?1:0;
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
		    } else if (room.controller.level >= 6 && room.mineral) {
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
            if (room.mineral) {
                if (room.createConstructionSite(room.mineral.pos, STRUCTURE_EXTRACTOR) == OK)
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
		    constr_sites_num += this.buildRoads(room);
	    }
        
        //building walls from lvl 4
        if (room.controller.level >= 4 && constr_sites_num == 0) {
            //this.buildAroundCenter(room, STRUCTURE_RAMPART, false);
            //this.buildAroundCenter(room, STRUCTURE_WALL, true);
            //constr_sites_num++;
        }

        // update construction manager 
        if (constr_sites_num > 0) {
            ConstructionManager.recalculateRoom(room);
        }
    },
    
    
    buildMiningStructure: function(room, type, steps_from_source=0) {
        var validPositions = [];
        
        //first - pick valid build positions
	    var sources = room.sources;
        if (room.controller.level >= 6 && type != STRUCTURE_LINK) {
            sources = sources.concat([room.mineral]);
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
                if (type == STRUCTURE_LINK) {
                    this.removeRoads(room, validPositions[0].pos);
                }
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
            var p = new RoomPosition(centerPos.x+deltas[i].x-this.template_center.x, centerPos.y+deltas[i].y-this.template_center.y, room.name);

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
            room.memory.center = {x: spawns[0].pos.x+1, y: spawns[0].pos.y+1};
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
        let cbpos = Intel.getPotClaimCenterPos(room.name);
        if (cbpos) {
            room.memory.center = {x: cbpos.x, y: cbpos.y};
            return true;
        }

        // calculate base pos ad hoc
        cbpos = BasePlanner.getBaseCenter(room.name)
        if (cbpos.pos) {
            room.memory.center = {x: cbpos.pos.x, y: cbpos.pos.y};
            return true;
        }
        
        return false;
    }, 
    
    getPositionDeltas: function(type)
    {
        return this.template.buildings[type].pos;
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
        var targets = room.find(FIND_STRUCTURES, {
            filter: (s) => { 
                return s.structureType == STRUCTURE_CONTAINER || 
                    s.structureType == STRUCTURE_CONTROLLER; 
            }
        });

        if (targets.length <= 0) return 0;
        
        let centerPos = this.getBaseCenterPoint(room);
        let builtRoads = 0;
        
        //roads from spawn to Structures
        for (let t of targets)
        {
            builtRoads += RoadPlanner.buildRoad(centerPos, t.pos);
            if (builtRoads > 0) break;	
        }
        
        //roads around spawn
        if (builtRoads == 0) {
            if (this.buildAroundCenter(room, STRUCTURE_ROAD, false)) {
                builtRoads++;
            }
        }

        return builtRoads;
    }
};
