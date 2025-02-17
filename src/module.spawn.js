module.exports = {
    run: function (spawn) {
        if (spawn.spawning) return;
        this.memCleanup();
        var room = spawn.room;

        // first, spawn from spawn list
        // soldiers, replacement creeps
        if (room.memory.spawnList && room.memory.spawnList.length > 0) {
            var ret = this.spawn(
                spawn,
                room.memory.spawnList[0].role,
                room.memory.spawnList[0].mem || {},
            );
            if (ret) {
                room.memory.spawnList.shift();
                return;
            }
        }

        // then, spawn room creeps
        var roomCreeps = room.find(FIND_MY_CREEPS);
        var counts = _.countBy(roomCreeps, "memory.role");
        var minerCount = counts.miner || 0;
        var upgraderCount = counts.upgrader || 0;
        var builderCount = counts.builder || 0;
        var haulerCount = counts.hauler || 0;

        var sourceCount = room.find(FIND_SOURCES).length;
        var mineralCount = room.find(FIND_MINERALS, {
            filter: (s) => {
                return s.mineralAmount > 0 || s.ticksToRegeneration <= 50;
            },
        }).length;
        var extractor_count = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_EXTRACTOR;
            },
        }).length;
        //extractors that could be harvested
        extractor_count = Math.min(extractor_count, mineralCount);

        // multiple miners per node if room is low level 1-3
        var minerMultiplyer = 1;
        if (spawn.room.controller.level < 4) {
            minerMultiplyer = 2;
        }

        if (minerCount > 0 && haulerCount < (room.memory.stats.haulers_needed || 3)) {
            this.spawn(spawn, "hauler");
        } else if (
            minerCount < sourceCount * minerMultiplyer + extractor_count &&
            !spawn.room.memory.attacked
        ) {
            this.spawn(spawn, "miner");
        } else if (upgraderCount < 1) {
            this.spawn(spawn, "upgrader");
        } else if (builderCount < (1 + (room.memory.stats.add_creeps || 0))) {
            this.spawn(spawn, "builder");
        }
    },

    spawn: function (spawn, role, memory = {}) {
        let data = { memory: { ...{ role: role }, ...memory } };

        var roomCreeps = spawn.room.find(FIND_MY_CREEPS);
        var counts = _.countBy(roomCreeps, "memory.role");
        var minerCount = counts.miner || 0;
        var haulerCount = counts.hauler || 0;

        //try to spawn creeps with full body parts
        //unless colony has to recover (miner or hauler missing, or energy level low)
        var avbl_energy = spawn.room.energyAvailable;
        var energy_ratio =
            spawn.room.memory.stats.energy / spawn.room.memory.stats.capacity;
        if (minerCount > 0 && haulerCount > 0 && energy_ratio >= 0.05) {
            avbl_energy = spawn.room.energyCapacityAvailable;
        }

        let body = baseCreep.buildBody(role, avbl_energy);
        let name = baseCreep.getName(spawn.room, role);
        var ret = spawn.spawnCreep(body, name, data);

        if (ret == OK) {
            return true;
        } else {
            return false;
        }
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
