module.exports = {
    INTEL_EXPIRATION_TIME: 3000,

    FRIEND: 'friend',
    ENEMY: 'enemy',
    NEUTRAL: 'neutral',

    TIME: 't',
    EXPIRATION: 'x',
    SOURCES: 's',
    MINERAL: 'm',
    DEPOSIT: 'd',
    DEPOSIT_COOLDOWN: 'dc',
    KEEPERS: 'k',
    CONTROLLER: 'c',
    CONTROLLER_LVL: 'cl',

    INVADER_CORE_LVL: 'il',
    INVADER_CORE_TICKS_TO_DEPLOY: 'it',

    OWNER: 'p',
    RESERVATION_OWNER: 'rp',
    RESERVATION_TICKS: 'rt',
    SPAWNS: 'bs',
    TOWERS: 'bt',
    STRUCTS: 'b',
    CREEPS: 'z',

    
    init: function()
    {
        if (!Memory.intel) {
			Memory.intel = {};
		}
		if (!Memory.intel.list) {
			Memory.intel.list = {};
		}
        if (!Memory.intel.req) {
			Memory.intel.req = [];
		}
        if (!Memory.intel.diplo) {
			Memory.intel.diplo = [];
		}
        if (!Memory.intel.claimable) {
            Memory.intel.claimable = [];
        }
    },

    run: function()
    {
        for (var r in Game.rooms) 
        {
            if (Game.rooms[r]) { // room visible
                this.collectIntel(Game.rooms[r]);
            }
        }
    },
    
    get: function(room_name) {
        return Memory.intel.list[room_name] || undefined;
    }, 
    
    collectIntel: function(room) {
        //skip own rooms
        if (room.my) {
            //delete own intel pages
            if (Memory.intel.list[room.name]) {
                delete Memory.intel.list[room.name];
            }
            return;
        }
		
		//recent intel
        let intel = this.get(room.name) || {};
        
        intel[this.TIME] = Game.time;

        // record permanent data -- record once
        if (intel[this.SOURCES] === undefined) {
            intel[this.SOURCES] = room.sources.length;
            intel[this.MINERAL] = room.mineral ? room.mineral.mineralType : undefined;
            intel[this.DEPOSIT] = room.deposit ? room.deposit.depositType : undefined;
            intel[this.KEEPERS] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_KEEPER_LAIR}).length || undefined;
            intel[this.CONTROLLER] = room.controller ? true : undefined;
        }
        if (intel[this.DEPOSIT]) {
            intel[this.DEPOSIT_COOLDOWN] = room.deposit.lastCooldown;
        }

        // record controller data - record every time
        if (intel[this.CONTROLLER]) {
            intel[this.CONTROLLER_LVL] = room.controller.level;
            intel[this.OWNER] = room.controller.owner ? room.controller.owner.username : undefined;

            if (room.controller.reservation) {
                intel[this.RESERVATION_OWNER] = room.controller.reservation.username;
                intel[this.RESERVATION_TICKS] = room.controller.reservation.ticksToEnd;
            } else {
                intel[this.RESERVATION_OWNER] = undefined;
                intel[this.RESERVATION_TICKS] = undefined;
            }
        }

        // structure data - record every 3000 ticks
        if ((intel[this.EXPIRATION] || 0) <= Game.time) {
            intel[this.EXPIRATION] = Game.time + this.INTEL_EXPIRATION_TIME;
            if (intel[this.CONTROLLER]) {
                intel[this.SPAWNS] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_SPAWN}).length;
                intel[this.TOWERS] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_TOWER}).length;
                intel[this.STRUCTS] = room.find(FIND_HOSTILE_STRUCTURES).length;
            }
            intel[this.CREEPS] = room.find(FIND_HOSTILE_CREEPS).length;
        }

        // record invasion data if applicable
        if (intel[this.RESERVATION_OWNER] == "Invader" || intel[this.OWNER] == "Invader") {
            let invaderCores = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType == STRUCTURE_INVADER_CORE});
            if (invaderCores.length > 0) {
                intel[this.INVADER_CORE_LVL] = invaderCores[0].level;
                intel[this.INVADER_CORE_TICKS_TO_DEPLOY] = invaderCores[0].ticksToDeploy;
            } else {
                intel[this.INVADER_CORE_LVL] = undefined;
                intel[this.INVADER_CORE_TICKS_TO_DEPLOY] = undefined;
            }
        }
        
        //save intel
        Memory.intel.list[room.name] = intel;
        
        //if room is in req, remove from req
        let index = Memory.intel.req.indexOf(room.name);
        if (index >= 0) {
            Memory.intel.req.splice(index, 1);
        }
        
        //potential new room?
        if (intel[this.CONTROLLER] && 
            intel[this.SOURCES] >= 2 &&
            !intel[this.OWNER])
        {
            this.addClaimable(room.name);
        }
    }, 
    
    setDiplomatics: function(playername, status)
    {
        var index = _.findIndex(Memory.intel.diplo, (s) => s.player == playername);
        if (index >= 0) {
            Memory.intel.diplo[index] = {player: playername, status: status};
        } else {
            Memory.intel.diplo.push({player: playername, status: status});
        }
    }, 
    
    getDiplomatics: function(playername)
    {
        var index = _.findIndex(Memory.intel.diplo, (s) => s.player == playername);
        if (index >= 0) {
            return Memory.intel.diplo[index].status;
        } else {
            Memory.intel.diplo.push({player: playername, status: this.NEUTRAL});
            return this.NEUTRAL;
        }
    },
    
    addClaimable: function(roomname)
    {
        var index = _.findIndex(Memory.intel.claimable, (s) => s.room == roomname);
        if (index >= 0) return; // room already in list
            
        let res = BasePlanner.getBaseCenter(roomname);
        Memory.intel.claimable.push({room: roomname, center: res.pos, points: res.points});
    }, 
    
    getPotClaimCenterPos: function(roomname)
    {        
        var index = _.findIndex(Memory.intel.claimable, (s) => s.room == roomname && s.parsed==true);
        if (index >= 0) {
            if (Memory.intel.claimable[index].parsed) {
                var center = Memory.intel.claimable[index].center;
                if (!center || center === undefined) return undefined;
                return new RoomPosition(center.x, center.y, roomname);
            }
        }
        
        return undefined;
    }, 
    
};