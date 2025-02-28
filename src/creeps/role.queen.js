/*
Memory Layout
.role = "queen"
.home = creep home room name
*/

module.exports = {
    name: 'queen', 
    run: function(creep) 
    {
        baseCreep.init(creep);

        // move to center
        let center = Autobuilder.getBaseCenterPoint(creep.home);
        if (!creep.pos.isEqualTo(center)) {
            baseCreep.moveTo(creep, center);
            return;
        }

        // get objects
        let link = this.getLink(creep);
        let spawn = this.getSpawn(creep);

        // last tick, drop all to storage
        if (creep.ticksToLive <= 1) {
            creep.transfer(creep.room.storage, RESOURCE_ENERGY);
            return;
        }

        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            // drain link
            if (link && link.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                creep.withdraw(link, RESOURCE_ENERGY);
                return;
            }

            // pickup from storage to fill spawn
            if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
                return;
            }

            // idles here
        } else {
            // spawn
            if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                creep.transfer(spawn, RESOURCE_ENERGY);
                return;
            }

            // storage
            creep.transfer(creep.room.storage, RESOURCE_ENERGY);
            return;
        }
    },

    getLink: function(creep) {
        if (creep.memory.link) {
            let link = Game.getObjectById(creep.memory.link);
            if (link) return link;
        }

        let link = baseCreep.getSpawnLink(creep.room);
        if (link) {
            creep.memory.link = link.id;
            return link;
        }
        return null;
    },

    getSpawn: function(creep) {
        if (creep.memory.spawn1) {
            let spawn = Game.getObjectById(creep.memory.spawn1);
            if (spawn) return spawn;
        }

        let spawns = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            }
        });

        if (spawns.length >= 1) {
            creep.memory.spawn1 = spawns[0].id;
            return spawns[0];
        }
        return null;
    }
}