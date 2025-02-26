module.exports = {
    run: function (room) {
        //defense list
        this.memCleanup(room);
        this.buildHostileList(room);

		// safe mode active, return
		if (room.controller.safeMode > 0) return;

        //towers shooting
        this.towerDefense(room);

        //DEFENSE
        if (room.memory.hostiles.length > 0) {
            room.memory.attacked_time = Game.time;

			// calculate threat level
			let threat = 0;
			for (let h of room.memory.hostiles) {
				if (h.role === "invader") continue;
				let creep = Game.getObjectById(h.creep);
				if (!creep) continue;
				threat += baseCreep.calcDps(creep);
				threat += baseCreep.calcHps(creep);
			}

           	// if threat is high, activate safe mode
			if (room.controller.safeModeAvailable > 0 && threat > 1200) {
				room.controller.activateSafeMode();
				return;
			}

            //autospawn a soldier
            var soldier = _.find(
                Memory.creeps,
                (s) => s.role == "soldier" && s.troom == room.name,
            );
            if (!soldier && threat > 1200) {
                var index = _.findIndex(
                    room.memory.spawnList,
                    (s) => s.role == "soldier",
                );
                if (index < 0) {
                    moduleSpawn.addSpawnList(room, "soldier", {
                        troom: room.name,
                        grp: "defend",
                        embark: true,
                        killSelf: true,
                    });
                }
            }
        }

        // SPAWN ROOM LIFETIME OPS
        if (Game.time % 100 == 0) {
            var index = _.findIndex(Memory.ops, (s) => {
                return s.type == "room_lifetime" && s.source == room.name;
            });
            if (index < 0) {
                Ops.new("room_lifetime", room.name, "");
            }
        }

        //calc wall hp
        if (room.controller.level == 4) {
            room.memory.walls = 50000;
        } else if (room.controller.level == 5) {
            room.memory.walls = 100000;
        } else if (room.controller.level == 6) {
            room.memory.walls = 500000;
        } else if (room.controller.level == 7) {
            room.memory.walls = 1000000;
        } else if (room.controller.level == 8) {
            room.memory.walls = 10000000;
        }
    },

    towerDefense: function (room) {
		var towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER },
        });

        //shoot hostiles
        var shooters = _.filter(room.memory.hostiles, (h) => h.shoot == true);
        for (s of shooters) {
            var hostile = Game.getObjectById(s.creep);
            if (!hostile) continue;

            // skip if tower can not damage
            let hps = baseCreep.calcHps(hostile);
            let dps = this.calcTowerDps(towers, hostile.pos);
            if (hps >= dps) continue;

            for (let tower of towers) {
                tower.attack(hostile);
            }
            return;
        }

        //heal creeps
        var injured = room.find(FIND_MY_CREEPS, {
            filter: (s) => s.hits < s.hitsMax,
        });
        if (injured.length > 0) {
            for (let tower of towers) {
                tower.heal(injured[0]);
            }
            return;
        }
    },

    calcTowerDps: function (towers, pos) {
        var dps = 0;
        for (var t of towers) {
            let dist = t.pos.getRangeTo(pos);
            // 600 hits at range <=5 to 150 hits at range ≥20
            dps += Math.min(600, Math.max(150, 600 - 30 * (dist - 5)));
        }
        return dps;
    },

    buildHostileList: function (room) {
        if (!room.memory.hostiles) {
            room.memory.hostiles = [];
        }

        var hostiles = room.find(FIND_HOSTILE_CREEPS);

        for (var h of hostiles) {
            var bparts = _.countBy(h.body, "type");

            //friendlies
            if (Intel.getDiplomatics(h.owner.username) == Intel.FRIEND) {
                continue;
            }

            //AI Hostiles
            if (h.owner.username == "Invader") {
                this.addToHostileList(room, 5, h.id, "invader");
                this.enableShoot(room, h.id);
            }

            //non-offensive-creeps
            if (
                !bparts[WORK] &&
                !bparts[ATTACK] &&
                !bparts[RANGED_ATTACK] &&
                !bparts[CLAIM]
            ) {
                if (bparts[HEAL] && bparts[HEAL] > 0) {
                    //healer? drainer?
                    this.addToHostileList(room, 6, h.id, "healer");
                    let nearcreeps = h.pos.findInRange(FIND_MY_CREEPS, 4);
                    let nearstructs = h.pos.findInRange(FIND_STRUCTURES, 4);
                    if (nearcreeps.length > 0 || nearstructs.length > 0) {
                        this.enableShoot(room, h.id);
                    }

                    continue;
                } else if (bparts[CARRY] && bparts[CARRY] > 0) {
                    //scooper? - shoot when close
                    this.addToHostileList(room, 4, h.id, "scooper");
                    let nearcreeps = h.pos.findInRange(FIND_MY_CREEPS, 2);
                    let nearstructs = h.pos.findInRange(FIND_STRUCTURES, 2);
                    if (nearcreeps.length > 0 || nearstructs.length > 0) {
                        this.enableShoot(room, h.id);
                    }

                    continue;
                }
                //scout
            } else {
                //dangerous creep
                this.addToHostileList(room, 5, h.id, "attacker");
                let nearcreeps = h.pos.findInRange(FIND_MY_CREEPS, 3);
                let nearstructs = h.pos.findInRange(FIND_STRUCTURES, 3);
                if (nearcreeps.length > 0 || nearstructs.length > 0) {
                    this.enableShoot(room, h.id);
                }

                continue;
            }
        }
    },

    addToHostileList: function (room, prio, creepid, role, shoot = false) {
        var index = _.findIndex(
            room.memory.hostiles,
            (c) => c.creep == creepid,
        );
        if (index < 0) {
            room.memory.hostiles.push({
                prio: prio,
                creep: creepid,
                role: role,
                shoot: shoot,
            });
        }
    },

    enableShoot: function (room, creepid) {
        var index = _.findIndex(
            room.memory.hostiles,
            (c) => c.creep == creepid,
        );
        if (index >= 0) {
            room.memory.hostiles[index].shoot = true;
        }
    },

    memCleanup: function (room) {
        for (var i in room.memory.hostiles) {
            var c = Game.getObjectById(room.memory.hostiles[i].creep);
            if (!c || c.room != room.name) {
                room.memory.hostiles.splice(i, 1);
                return;
            }
        }
    },

    getSummedDistanceFromTowers: function (pos, room) {
        var towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER },
        });

        var ret = 0;
        for (var t of towers) {
            ret += t.pos.getRangeTo(t.pos);
        }

        return ret;
    },
};
