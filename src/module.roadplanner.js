const PLAIN_COST = 3;
const WALL_COST = 15 * PLAIN_COST;
const SWAMP_COST = 4;
const EXISTING_PATH_COST = PLAIN_COST - 1;

class RoadPlanner {
    constructor() {
        this.costMatrices = {};
        // idea, save all roads in object and cache
        // then when executing buildMissing, build new roads
        // when repairing, check if road is in cache, if not, do not repair
    }

    buildRoad(from, to) {
        const callback = (roomName) => {
            if (!this.costMatrices[roomName]) {
                this.costMatrices[roomName] = this.generateRoadPlanningCostMatrix(roomName);
            }
            return this.costMatrices[roomName];
        };

        let goal = { pos: to, range: 1 };
        let res = PathFinder.search(from, goal, { roomCallback: callback });
        let path = res.path;
        let builtRoads = 0;

        // build whole path
        for (var i=0; i < path.length; i++)
        {
            if (!Game.rooms[path[i].roomName]) continue; // room not visible, can not build roads
            const sites = path[i].lookFor(LOOK_CONSTRUCTION_SITES);
            if (sites.length > 0) {
                continue;
            }
            const structures = path[i].lookFor(LOOK_STRUCTURES);
            if (structures.length > 0) {
                continue;
            }

            if (path[i].createConstructionSite(STRUCTURE_ROAD) == OK) {
                this.costMatrices[path[i].roomName].set(path[i].x, path[i].y, EXISTING_PATH_COST); // update cost matrix
                builtRoads++;
            }
        }
        return builtRoads;
    }

    generateRoadPlanningCostMatrix(roomName) {
        let room = Game.rooms[roomName];
        if (!room) return;
        let matrix = new PathFinder.CostMatrix;

        const terrain = Game.map.getRoomTerrain(roomName);
        for (let y = 0; y < 50; ++y) {
			for (let x = 0; x < 50; ++x) {
				switch (terrain.get(x, y)) {
					case TERRAIN_MASK_SWAMP:
						matrix.set(x, y, SWAMP_COST);
						break;
					case TERRAIN_MASK_WALL:
						if (x != 0 && y != 0 && x != 49 && y != 49) {
							// Can't tunnel through walls on edge tiles
							matrix.set(x, y, WALL_COST);
						}
						break;
					default: // plain
						matrix.set(x, y, PLAIN_COST);
						break;
				}
			}
		}

        room.find(FIND_STRUCTURES).forEach(function(struct) {
            if (struct.structureType === STRUCTURE_ROAD) {
                matrix.set(struct.pos.x, struct.pos.y, EXISTING_PATH_COST);
            } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                        (struct.structureType !== STRUCTURE_RAMPART ||
                        !struct.my)) {
                matrix.set(struct.pos.x, struct.pos.y, 0xff);
            }
        });

        room.find(FIND_CONSTRUCTION_SITES).forEach(function(site) {
            if (site.structureType === STRUCTURE_ROAD) {
                matrix.set(site.pos.x, site.pos.y, EXISTING_PATH_COST);
            } else if (site.structureType !== STRUCTURE_CONTAINER) {
                matrix.set(site.pos.x, site.pos.y, 0xff);
            }
        });

        return matrix;
    }
}

module.exports = new RoadPlanner();