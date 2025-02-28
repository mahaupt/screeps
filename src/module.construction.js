const REPAIR_THRESHOLD = 0.8;
const EMERGENCY_REPAIR = 0.15;
const CONSTRUCTION_UPDATE_INTERVAL = 200; // build and finished buildings trigger refresh

class ConstructionManager {
    constructor() {
        this.lastUpdate = {};
        this.constructionSites = {};
        this.repairSites = {};
        this.repairPoints = {};
        this.emergencyRepairs = {}; // how many emergencies in repairSites (at beginning)
        this.skipUpgradeDueEnergy = {}
    }

    getNewTask(room, energyAvbl) {
        // TODO: cache if no task was returned to save

        let rooms = this.getSubRooms(room);
        rooms.unshift(room);

        let constructionTask;

        for (let r of rooms) {
            // skip room due attack
            if (r.memory.attacked_time + 300 > Game.time) continue;

            // repairs
            if (this.emergencyRepairs[r.name] > 0 || this.repairPoints[r.name] >= energyAvbl*REPAIR_POWER) {
                this.emergencyRepairs[r.name] = 0; // reset emergency repairs
                this.repairPoints[r.name] = Math.max(0, this.repairPoints[r.name] - energyAvbl*REPAIR_POWER);
                // pass repair sites by reference, builders unshift by themselves
                return { t: "repair", r: r.name, l: this.repairSites[r.name] }
            }

            // construction
            if (!constructionTask && !this.skipUpgradeDueEnergy[room.name] && this.constructionSites[r.name] && this.constructionSites[r.name].length > 0) {
                constructionTask = { t: "build", r: r.name, l: [...this.constructionSites[r.name]] }
            }
        }

        // controller upgrade
        if (!constructionTask && !this.skipUpgradeDueEnergy[room.name] && room.my) {
            return { t: "upgrade", r: room.name, l: [ room.controller.id ] }
        }
        
        return constructionTask;
    }

    // update construction and repair sites
    run(room) {
        // not updating every tick
        if (this.lastUpdate[room.name] && this.lastUpdate[room.name]+CONSTRUCTION_UPDATE_INTERVAL > Game.time) return;
        this.lastUpdate[room.name] = Game.time;
        console.log("construction recalc " + room.name);

        let subrooms = this.getSubRooms(room);
        subrooms.unshift(room);
        for (let i in subrooms) {
            this.calculateRepairTasks(subrooms[i]);
            this.calculateConstructionTasks(subrooms[i]);
        }

        // skip construction and upgrade due to energy levels
        var energy = room.memory.stats.energy;
        var cap = room.memory.stats.capacity;
        var ratio = energy / cap;

        this.skipUpgradeDueEnergy[room.name] = (cap > 800 && ratio <= 0.05);
    }

    // forces room update on next tick
    recalculateRoom(room) {
        this.lastUpdate[room.name] = Game.time-CONSTRUCTION_UPDATE_INTERVAL+1;
    }

    calculateRepairTasks(room) {
        let structures = [];
        let repairPoints = 0;
        let emergencies = 0;
        room.find(FIND_STRUCTURES).forEach(s => {
            // skip walls
            if (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) return;
            if (s.hits < s.hitsMax * EMERGENCY_REPAIR) {
                structures.unshift(s.id);
                repairPoints += s.hitsMax - s.hits;
                emergencies++;
            } else if (s.hits < s.hitsMax * REPAIR_THRESHOLD) {
                structures.push(s.id);
                repairPoints += s.hitsMax - s.hits;
            }
        });

        this.repairSites[room.name] = structures;
        this.repairPoints[room.name] = repairPoints;

        if (emergencies > 0) {
            this.emergencyRepairs[room.name] = emergencies;
        } else {
            delete this.emergencyRepairs[room.name];
        }
    }

    calculateConstructionTasks(room) {
        let structures = room.find(FIND_MY_CONSTRUCTION_SITES)
        structures = _.sortBy(structures, [(s) => buildOrder(s.structureType), "progress"]);
        this.constructionSites[room.name] = structures.map((s) => s.id);
    }

    buildOrder(structureType) {
        switch(structureType) {
            case STRUCTURE_SPAWN:
                return 1;
            case STRUCTURE_EXTENSION:
                return 2;
            case STRUCTURE_CONTAINER:
                return 3;
            case STRUCTURE_STORAGE:
                return 4;
            case STRUCTURE_LINK:
                return 5;
            default:
                return 9;
        }
    }

    getSubRooms(baseRoom) {
        let subRooms = [];
        // GET TASKS FROM HARVESTING ROOMS (ROADS)
        let tasks = _.filter(Memory.ops, (o) => o.source == baseRoom.name && o.type == "harvest");
        for(let t of tasks) {
            let room = Game.rooms[t.target];
            if (!room) continue;
            subRooms.push(room);
        }
        return subRooms;
    }
}

module.exports = new ConstructionManager();