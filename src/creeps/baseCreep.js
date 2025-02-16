module.exports = {
    getName: function (room, role) {
        var baseName = role + "-#";
        var name = "";

        do {
            name = baseName + this.getRandomString(3);
        } while (Game.creeps[name]);

        return name;
    },

    getRandomString: function (length) {
        var randomChars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var result = "";
        for (var i = 0; i < length; i++) {
            result += randomChars.charAt(
                Math.floor(Math.random() * randomChars.length),
            );
        }
        return result;
    },

    pickEnergySource: function (creep) {
        //try to find half full containers
        var c = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return (
                    (structure.structureType == STRUCTURE_CONTAINER &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) /
                            structure.store.getCapacity(RESOURCE_ENERGY) >
                            0.3) ||
                    ((structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE) &&
                        structure.pos.findInRange(FIND_SOURCES, 2).length ==
                            0 &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
                );
            },
        });
        if (c) {
            creep.memory.source = c.id;
        } else {
            // get loot from energy logistics
            let tasks = Logistics.getNewTasks(
                creep.room,
                creep.store.getFreeCapacity(RESOURCE_ENERGY),
                (task) => task.type == "loot" && task.res == RESOURCE_ENERGY,
            );
            if (tasks.length > 0) {
                let task = Logistics.getTask(creep.room, tasks[0].id);
                creep.memory.task = tasks[0];
                creep.memory.source = task.src;
            }
        }
    },

    goGetEnergyFromSource: function (creep) {
        var source = Game.getObjectById(creep.memory.source);
        // source is gone, reset and abort task
        if (!source) {
            this.deleteSource(creep);
            return;
        }

        if (!creep.pos.inRangeTo(source, 1)) {
            this.moveTo(creep, source, {
                range: 1,
            });
            return;
        }

        if (source instanceof Resource) {
            // pickup and mark task as done
            creep.pickup(source);
            if (creep.memory.task) {
                Logistics.markPickup(
                    creep.room,
                    creep.memory.task.id,
                    creep.memory.task.vol,
                    creep.memory.task.vol,
                );
                Logistics.markDropoff(
                    creep.room,
                    creep.memory.task.id,
                    creep.memory.task.vol,
                );
                delete creep.memory.task;
            }
        } else {
            creep.withdraw(source, RESOURCE_ENERGY);
            this.deleteSource(creep); // withdraw ok or not -> delete source
        }
    },

    pickupDroppedEnergy: function (creep, range) {
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            var res = creep.pos.findInRange(FIND_DROPPED_RESOURCES, range);
            var ts = creep.pos.findInRange(FIND_TOMBSTONES, range);
            var ru = creep.pos.findInRange(FIND_RUINS, range);

            var targets = res.concat(ts).concat(ru);

            if (targets.length > 0) {
                var dist = creep.pos.getRangeTo(targets[0]);

                var amount =
                    targets[0].amount || targets[0].store[RESOURCE_ENERGY];
                //console.log("amount: " + amount);

                //worth it?
                if (amount > 0 && amount > dist * 10) {
                    //console.log("dropped res found - pickup");

                    if (dist > 1) {
                        this.moveTo(creep, targets[0], {
                            range: 1,
                        });
                        return true;
                    }

                    if (targets[0] instanceof Resource) {
                        creep.pickup(targets[0]);
                    } else {
                        creep.withdraw(targets[0], RESOURCE_ENERGY);
                    }

                    return true;
                }
            }
        }

        return false;
    },

    buildBody: function (room, role, bodySize) {
        var body = [];

        var ntough = 0;
        var nwork = bodySize;
        var ncarry = bodySize;
        var nclaim = 0;
        var nmove = bodySize;
        var nattack = 0;
        var nrattack = 0;
        var nheal = 0;

        //statistics
        var ncontainer = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTAINER;
            },
        }).length;

        if (role == "miner") {
            bodySize = Math.min(bodySize, 3);
            nwork = bodySize * 2;
            ncarry = 1;
            nmove = bodySize;
        } else if (role == "hauler") {
            bodySize = Math.min(bodySize, 5);
            nwork = 0;
            ncarry = Math.min(2 * bodySize + 1, 25);
            nmove = Math.min(2 * bodySize - 1, 25);
        } else if (role == "upgrader") {
            bodySize = Math.min(bodySize, 5);
            nwork = bodySize;
            ncarry = bodySize;
            nmove = bodySize;
        } else if (role == "builder") {
            bodySize = Math.min(bodySize, 10);
            nwork = bodySize;
            ncarry = bodySize;
            nmove = bodySize;
        } else if (role == "scout") {
            nwork = 0;
            ncarry = 0;
            nmove = 1;
        } else if (role == "pioneer") {
            nwork = 2;
            ncarry = 4;
            nmove = 6;
        } else if (role == "claimer") {
            nwork = 0;
            ncarry = 0;
            nclaim = 1;
            nmove = 1;
        } else if (role == "reserver") {
            nwork = 0;
            ncarry = 0;
            nclaim = Math.max(Math.round(bodySize / 2), 1);
            nmove = 1;
        } else if (role == "soldier") {
            if (bodySize > 2) {
                bodySize = Math.min(bodySize, 8);
                nwork = 0;
                ncarry = 0;
                ntough = bodySize; //10
                nmove = 2 * bodySize + 1; //50
                nattack = bodySize; //80
                nheal = 1; // 250
            } else {
                nwork = 0;
                ncarry = 0;
                ntough = bodySize;
                nmove = 2 * bodySize;
                nattack = bodySize;
            }
        } else if (role == "drainer") {
            bodySize = Math.min(bodySize, 16);
            nwork = 0;
            ncarry = 0;
            ntough = bodySize * 2; //29; //10
            nmove = Math.round(bodySize * 2.5); //17; //50
            nheal = Math.round(bodySize * 0.5); //4; // 250
        } else if (role == "dismantler") {
            ncarry = 0;

            bodySize = Math.min(bodySize, 10);

            ntough = bodySize; //10
            nwork = Math.round(0.5 * bodySize); // 100
            nrattack = Math.round(0.5 * bodySize);
            nmove = Math.ceil(2.5 * bodySize); //17; //50
            nheal = Math.round(0.5 * bodySize); //4; // 250
        } else if (role == "harvester") {
            bodySize = Math.min(bodySize, 16);
            nwork = Math.ceil(0.5 * bodySize);
            ncarry = bodySize;
            nmove = Math.ceil(1.5 * bodySize);
        }
        if (role == "healer") {
            bodySize = Math.min(bodySize, 25);
            nwork = 0;
            ncarry = 0;
            nmove = bodySize; //50
            nheal = bodySize; //250
        }
        //upgrader && builder == standard

        //max 50 body parts - reducing
        if (nwork + ncarry + nmove > 50) {
            var above = nwork + ncarry + nmove - 50;
            nwork -= Math.ceil((nwork / 50) * above);
            ncarry -= Math.ceil((ncarry / 50) * above);
            nmove -= Math.ceil((nmove / 50) * above);
        }

        //Tough
        for (var h = 0; h < ntough; h++) {
            body.push(TOUGH);
        }

        //WORK
        for (var i = 0; i < nwork; i++) {
            body.push(WORK);
        }

        //CARRY
        for (var j = 0; j < ncarry; j++) {
            body.push(CARRY);
        }

        //CLAIM
        for (var k = 0; k < nclaim; k++) {
            body.push(CLAIM);
        }

        //MOVE
        for (var l = 0; l < nmove; l++) {
            body.push(MOVE);
        }

        //attack
        for (var m = 0; m < nattack; m++) {
            body.push(ATTACK);
        }

        //ranged attack
        for (var n = 0; n < nrattack; n++) {
            body.push(RANGED_ATTACK);
        }

        //heal
        for (var o = 0; o < nheal; o++) {
            body.push(HEAL);
        }

        return body;
    },

    getSuitableBodySize: function (role, availableEnergy) {
        var size = Math.floor(availableEnergy / 400);
        size = Math.max(size, 1);

        if (availableEnergy >= 500 && availableEnergy <= 800) {
            size = 2;
        }

        return size;
    },

    //get equivalent body size considering boosts
    getCreepBodyStrength: function (creep) {
        var bodySize = 0;
        for (var i in creep.body) {
            var add = 1;
            if (creep.body[i].boost) {
                var effect = BOOSTS[creep.body[i].type][creep.body[i].boost];
                add *= effect[Object.keys(effect)[0]];
            }
            bodySize += add;
        }
        return bodySize;
    },

    getSpawnLink: function (room) {
        var cpoint = moduleAutobuilder.getBaseCenterPoint(room);
        var spawnlink = cpoint.findInRange(FIND_STRUCTURES, 2, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_LINK;
            },
        });
        if (spawnlink.length > 0) {
            return spawnlink[0];
        }

        return false;
    },

    sendLinkToSpawn: function (link) {
        if (link.cooldown > 0) return false;
        var spawnlink = this.getSpawnLink(link.room);
        if (spawnlink) {
            //spawnlink has full capacity
            if (
                spawnlink.store.getFreeCapacity(RESOURCE_ENERGY) ==
                LINK_CAPACITY
            ) {
                if (link.transferEnergy(spawnlink) == OK) {
                    var amt = Math.round(
                        link.store[RESOURCE_ENERGY] * (1 - LINK_LOSS_RATIO),
                    );
                    moduleLogistics.addTransportTask(
                        link.room,
                        spawnlink,
                        link.room.storage,
                        amt,
                        RESOURCE_ENERGY,
                        7,
                        "l",
                    );
                    return true;
                }
            } else {
                //console.log("Spawnlink full");
                var amt = spawnlink.store[RESOURCE_ENERGY];
                moduleLogistics.addTransportTask(
                    link.room,
                    spawnlink,
                    link.room.storage,
                    amt,
                    RESOURCE_ENERGY,
                    7,
                    "l",
                );
            }
        }
        return false;
    },

    skipDueEnergyLevels: function (creep) {
        //no skipping if room is attacked
        if (creep.room.memory.attacked_time + 30 > Game.time) {
            return false;
        }

        var energy = creep.room.memory.stats.energy;
        var cap = creep.room.memory.stats.capacity;
        var ratio = energy / cap;

        if (cap > 800 && ratio <= 0.05) {
            creep.say("😴");
            this.moveTo(creep, creep.room.controller);
            return true;
        }
        return false;
    },

    moveTo: function (creep, target, options = {}) {
        creep.travelTo(target, options);
    },

    //moves creep to room name, avoids source keeper
    moveToRoom: function (creep, name) {
        creep.travelTo(new RoomPosition(25, 25, name), {range: 10});
    },

    init: function (creep) {
        //set home
        if (!creep.memory.home) {
            creep.memory.home = creep.room.name;
            return true;
        }
        return false;
    },

    getStoredResourceTypes: function (store) {
        if (!store) return [];
        return _.filter(Object.keys(store), (resource) => store[resource] > 0);
    },

    // return true if creep is ready and prepared
    // return false if not ready yet
    prepareCreep: function (creep) {
        //creep is not home - reset prepare
        if (creep.room.name != creep.memory.home) {
            creep.memory.embark = true;
            return false;
        }

        //renew creeps
        var spawns = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_SPAWN,
        });

        if (spawns.length > 0) {
            if (!creep.pos.inRangeTo(spawns[0], 1)) {
                this.moveTo(creep, spawns[0], {
                    range: 1,
                });
                return false; //not ready
            }

            if (spawns[0].renewCreep(creep) == ERR_FULL) {
                creep.memory.embark = true;
                return true;
            }
        }
        return false;
    },

    findBoostRes: function (boost) {
        var boost_res = [];

        for (var w in BOOSTS) {
            for (var res in BOOSTS[w]) {
                if (BOOSTS[w][res][boost]) {
                    boost_res.push(res);
                }
            }
        }

        return boost_res.reverse();
    },

    //find labs to boost creep
    boostCreep: function (creep, boosts) {
        var found_labs = false;

        for (var boost of boosts) {
            var res_array = this.findBoostRes(boost);
            for (var res of res_array) {
                var amt = Labs.Boost.calcDemand(creep, res);
                var lab = Labs.Boost.findBoostLab(creep.room, res, amt);
                if (lab) {
                    found_labs = true;
                    if (!creep.memory.boostLabs) {
                        creep.memory.boostLabs = [];
                    }
                    creep.memory.boostLabs.push(lab.id);
                    break;
                }
            }
        }

        if (found_labs) {
            creep.memory.boostSelf = true;
        }
        return found_labs;
    },

    deleteSource: function (creep) {
        if (creep.memory.source) {
            delete creep.memory.source;
        }
        if (creep.memory.task) {
            Logistics.markCancel(
                creep.room,
                creep.memory.task.id,
                creep.memory.task.vol,
            );
            delete creep.memory.task;
        }
    },

    flee: function (creep) {
        //drop energy and flee to next tower
    },

    calcDps: function (creep) {
        var dps = 0;
        for (var i in creep.body) {
            if (creep.body[i].type == ATTACK) {
                dps += 30;
            } else if (creep.body[i].type == RANGED_ATTACK) {
                dps += 10;
            }
        }
        return dps;
    },

    calcHps: function (creep) {
        var hps = 0;
        for (var i in creep.body) {
            if (creep.body[i].type == HEAL) {
                hps += 12;
            }
        }
        return hps;
    },

    memCleanup: function (i) {
        // cancel open tasks
        let cxtask = (t) => {
            if (t.utx > 0) {
                Logistics.markAbort(Game.rooms[mem.home], t.id, t.utx);
            } else {
                Logistics.markCancel(Game.rooms[mem.home], t.id, t.vol);
            }
        };

        let mem = Memory.creeps[i];
        if (mem.tasks && mem.tasks.length > 0) {
            for (var t of mem.tasks) {
                cxtask(t);
            }
        }
        if (mem.task) {
            cxtask(mem.task);
        }
        delete Memory.creeps[i];
    },
};
