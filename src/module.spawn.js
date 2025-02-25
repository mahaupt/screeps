module.exports = {
    max_builders: 8, // TODO: balance this value
    max_haulers: 3,
    run: function (room) {
        // first, spawn from spawn list
        // soldiers, replacement creeps
        if (room.memory.spawnList && room.memory.spawnList.length > 0) {
            var ret = this.spawn(
                room,
                room.memory.spawnList[0].role,
                room.memory.spawnList[0].mem || {},
            );
            if (ret) {
                room.memory.spawnList.shift();
                return;
            }
        }

        // save cpu
        if (Game.time % 10 !== 0) return;
        this.memCleanup();

        // then, spawn room creeps
        var roomCreeps = room.find(FIND_MY_CREEPS);
        var counts = _.countBy(roomCreeps, "memory.role");
        var minerCount = counts.miner || 0;
        var upgraderCount = counts.upgrader || 0;
        var builderCount = counts.builder || 0;
        var haulerCount = counts.hauler || 0;

        var sourceCount = room.sources.length;
        var mineralCount = (room.mineral && (room.mineral.mineralAmount > 0 || room.mineral.ticksToRegeneration <= 50)) ? 1 : 0;
        var extractor_count = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_EXTRACTOR;
            },
        }).length;
        //extractors that could be harvested
        extractor_count = Math.min(extractor_count, mineralCount);

        // multiple miners per node if small miners (less than 10 body parts = 800 energy)
        var minerMultiplyer = 1;
        if (room.controller.level <= 3) {
            if (room.energyCapacityAvailable < 800) {
                minerMultiplyer = 2;
            }
        }

        // TODO: remove me
        if (room.memory.stats.add_creeps >= 0 && !room.memory.stats.builders_needed) {
            room.memory.stats.builders_needed = room.memory.stats.add_creeps+1;
        }
        delete room.memory.stats.add_creeps;

        if (minerCount > 0 && haulerCount < (room.memory.stats.haulers_needed || this.max_haulers)) {
            this.spawn(room, "hauler");
        } else if (
            minerCount < sourceCount * minerMultiplyer + extractor_count &&
            !room.memory.attacked
        ) {
            this.spawn(room, "miner");
        } else if (upgraderCount < 1) {
            this.spawn(room, "upgrader");
        } else if (builderCount < (room.memory.stats.builders_needed || this.max_builders)) {
            this.spawn(room, "builder");
        }
    },

    spawn: function (room, role, memory = {}) {
        let data = { memory: { ...{ role: role }, ...memory } };

        var roomCreeps = room.find(FIND_MY_CREEPS);
        var counts = _.countBy(roomCreeps, "memory.role");
        var minerCount = counts.miner || 0;
        var haulerCount = counts.hauler || 0;

        //try to spawn creeps with full body parts
        //unless colony has to recover (miner or hauler missing, or energy level low)
        var avbl_energy = room.energyAvailable;
        var energy_ratio =
            room.memory.stats.energy / room.memory.stats.capacity;
        if (minerCount > 0 && haulerCount > 0 && energy_ratio >= 0.05) {
            avbl_energy = room.energyCapacityAvailable;
        }

        // build creep
        let body = baseCreep.buildBody(role, avbl_energy);
        let name = baseCreep.getName(room, role);

        // find free spawn and spawn
        let spawn = this.getFreeSpawn(room);
        if (!spawn) return false;
        let ret = spawn.spawnCreep(body, name, data);

        if (ret == OK) {
            return true;
        } else {
            return false;
        }
    },

    getFreeSpawn: function(room) {
        var spawns = room.find(FIND_MY_SPAWNS, {
            filter: (spawn) => {
                return spawn.spawning == null;
            },
        });

        // check if no renewing creep is nearby
        for(let spawn of spawns) {
            let renewCreeps = spawn.pos.findInRange(FIND_MY_CREEPS, 1, {
                filter: (creep) => {
                    return creep.memory.renewSelf;
                }
            });
            // if no renewing creeps, return this spawn
            if (renewCreeps.length == 0) {
                return spawn;
            }
        }

        return false;
    },

    addSpawnList: function (room, role, memory = {}, priority = false) {
        if (!room.memory.spawnList) {
            room.memory.spawnList = [];
        }

        var s = { role: role, mem: memory };
        if (priority) {
            room.memory.spawnList.unshift(s);
        } else {
            room.memory.spawnList.push(s);
        }
    },

    memCleanup: function () {
        for (var i in Memory.creeps) {
            if (!Game.creeps[i]) {
                baseCreep.memCleanup(i);
            }
        }
    },
};
