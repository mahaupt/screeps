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
        let capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
        let c = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE) &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) >= capacity;
            },
        });
        if (c) {
            creep.memory.source = c.id;
        } else {
            // get loot from energy logistics
            let tasks = Logistics.getNewTasks(
                creep.home,
                creep.store.getFreeCapacity(RESOURCE_ENERGY),
                (task) => (task.type == "loot" || task.type == "mc") && task.res == RESOURCE_ENERGY,
            );
            if (tasks.length > 0) {
                let task = Logistics.getTask(creep.home, tasks[0].id);
                creep.memory.task = tasks[0];
                creep.memory.source = task.src;
            } else {
                // no storage in room, no tasks avbl, get from home storage
                if (creep.home.storage) {
                    creep.memory.source = creep.home.storage.id;
                }
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
                    creep.home,
                    creep.memory.task.id,
                    creep.memory.task.vol,
                    creep.memory.task.vol,
                );
                Logistics.markDropoff(
                    creep.home,
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

    buildBody: function (role, energy_avbl) {
        var body = [];

        var ntough = 0; // 10
        var nwork = 0; // 100
        var ncarry = 0; // 50
        var nmove = 0; // 50
        var nclaim = 0; // 600
        var nattack = 0; // 80
        var nrattack = 0; // 150
        var nheal = 0; // 250

        if (role == "miner") {
            let bodySize = Math.floor((energy_avbl-50)/250);
            bodySize = Math.max(Math.min(bodySize, 4), 1);
            ncarry = 1;
            nwork = bodySize*2;
            nmove = bodySize;
        } else if (role == "hauler") {
            let bodySize = Math.floor(energy_avbl/150);
            bodySize = Math.max(Math.min(bodySize, 16), 1);
            ncarry = bodySize*2;
            nmove = bodySize;
        } else if (role == "upgrader" || role == "builder") {
            let bodySize = Math.floor(energy_avbl/200);
            bodySize = Math.max(Math.min(bodySize, 16), 1);
            nwork = bodySize;
            ncarry = bodySize;
            nmove = bodySize;
        } else if (role == "queen") {
            ncarry = 2;
            nmove = 1;
        } else if (role == "scout") {
            nmove = 1;
        } else if (role == "pioneer") {
            nwork = 2;
            ncarry = 4;
            nmove = 6;
        } else if (role == "claimer") {
            nclaim = 1;
            nmove = 1;
        } else if (role == "reserver") {
            let bodySize = Math.floor(energy_avbl/650);
            bodySize = Math.max(Math.min(bodySize, 7), 1);
            nclaim = bodySize;
            nmove = bodySize;
        } else if (role == "soldier") {
            let bodySize = Math.floor(energy_avbl/140);
            bodySize = Math.max(Math.min(bodySize, 10), 1);
            ntough = bodySize;
            nmove = bodySize;
            nattack = bodySize;
        } else if (role == "drainer") {
            let bodySize = Math.floor(energy_avbl/300);
            bodySize = Math.max(Math.min(bodySize, 16), 1);
            ntough = bodySize;
            nmove = bodySize;
            nheal = bodySize;
        } else if (role == "dismantler") {
            let bodySize = Math.floor((energy_avbl-300)/250);
            bodySize = Math.max(Math.min(bodySize, 8), 1);
            ntough =  bodySize*3;
            nwork =  bodySize;
            nmove =  bodySize*2+1;
            nheal =  1; 
        } else if (role == "harvester") {
            let bodySize = Math.floor(energy_avbl/200);
            bodySize = Math.max(Math.min(bodySize, 16), 1);
            nwork = bodySize;
            ncarry = bodySize;
            nmove = bodySize;
        }
        if (role == "healer") {
            let bodySize = Math.floor(energy_avbl/300);
            bodySize = Math.max(Math.min(bodySize, 25), 1);
            nmove = bodySize;
            nheal = bodySize;
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
        var cpoint = Autobuilder.getBaseCenterPoint(room);
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
        // check if link is full
        if (spawnlink && spawnlink.store.getFreeCapacity(RESOURCE_ENERGY) == LINK_CAPACITY) {
            if (link.transferEnergy(spawnlink) == OK) {
                return true;
            }
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
        if (!creep.isAtHome) {
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
                creep.home,
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

    killSelfDecision: function(creep) 
	{
		//never kill self creeps
		if (creep.memory.role == 'soldier') return;
		
        var possibleBodyParts = baseCreep.buildBody(creep.memory.role, creep.room.energyAvailable).length;

		if (possibleBodyParts > creep.body.length)
        {
	        creep.memory.killSelf = true;
        }
	}
};
