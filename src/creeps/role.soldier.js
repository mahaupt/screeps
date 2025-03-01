/*
Memory Layout
role = 'soldier'
home = home room name
grp = group.id
grp_lead = creep.id / 'self'
grp_follow = [creep ids of follower]

troom = room name to start attack
tx = xcord of target
ty = ycord of target
trange = range of targets at pos

target - object id of attack target
passive = false

attacked_time = 0;
*/

module.exports = {
    name: 'soldier', 
    boost: ['damage', 'rangedAttack'], 
    run: function(creep) {
        baseCreep.init(creep);
        
        var leader = this.getLeader(creep);
        
        this.attackDetection(creep, leader);
        this.healSelf(creep);
        
        if (creep.memory.grp_lead == 'self')
        {
            creep.say('⭐');
            this.leader(creep);
        } else {
            this.sheep(creep, leader);
        }
        
    }, 
    
    
    sheep: function(creep, leader)
    {
        //copy leader memory
        creep.memory.grp_follow = leader.memory.grp_follow;
        creep.memory.troom = leader.memory.troom;
        creep.memory.tx = leader.memory.tx;
        creep.memory.ty = leader.memory.ty;
        creep.memory.trage = leader.memory.trange;
        creep.memory.target = leader.memory.target;
        creep.memory.passive = leader.memory.passive;
        
        //shoot at target
        if (leader.memory.target) 
        {
            var target = Game.getObjectById(leader.memory.target);
            if (target)
            {
                this.attack(creep, target);
                return;
            }
        }
        
        //if target room - prepare for embarkation
        if (creep.memory.troom && !creep.memory.embark) {
            if (baseCreep.prepareCreep(creep)) {
                baseCreep.boostCreep(creep, this.boost);
            }
            return;
        } else if (!creep.memory.troom) {
            delete creep.memory.embark;
        }
        
        //follow leader
        baseCreep.moveTo(creep, leader, {range: 1});
    }, 
    
    leader: function(creep)
    {
        // troom but not visible, go to room
        // troom visible pick target and go to target

        //no target room - go home
        if (!creep.memory.troom) 
        {
            if (!creep.isAtHome) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            }
            else 
            {
                //idle around controller
                creep.say("😴");
                baseCreep.moveTo(creep, creep.room.controller);
                this.pickTarget(creep);
            }
            delete creep.memory.embark;
            return;
        }

        // troom not visible, move to room
        let troom = Game.rooms[creep.memory.troom];
        if (!troom) {
            baseCreep.moveToRoom(creep, creep.memory.troom);
            return;
        }
        
        //search for targets in room
        if (!creep.memory.target && !creep.memory.passive) 
        {
            var tposition = null;
            var trange = -1;
            if (creep.memory.tx && creep.memory.ty) {
                tposition = new RoomPosition(creep.memory.tx, creep.memory.ty, creep.memory.troom);
            }
            if (creep.memory.trange) {
                trange = creep.memory.trange;
            }
            
            this.pickTarget(creep, tposition, trange);
        }

        //target
        if (creep.memory.target) {
            let target = Game.getObjectById(creep.memory.target);
            if (target) {
                this.attack(creep, target);
                return;
            } else {
                delete creep.memory.target;
            }
        }
    }, 
    
    attack: function(creep, target)
    {
        creep.say("⚔️");
        
        if (!creep.pos.inRangeTo(target, 1)) {
            baseCreep.moveTo(creep, target, {range: 1});
        } else {
            creep.attack(target);
        }
    }, 
    
    pickTarget: function(creep, findAtPos = null, range = -1)
    {
        if (!findAtPos) {
            findAtPos = creep.pos;
        }
        
        let hostiles = null;
        let structures = null;
        
        if (range <= 0) {
            hostiles = findAtPos.findClosestByPath(FIND_HOSTILE_CREEPS, {filter: (s) => Intel.getDiplomatics(s.owner.username) != Intel.FRIEND});
            structures = findAtPos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                filter: (s)=>(s.structureType == STRUCTURE_TOWER || 
                    s.structureType == STRUCTURE_SPAWN ||
                    s.structureType == STRUCTURE_INVADER_CORE) && 
                    Intel.getDiplomatics(s.owner.username) != Intel.FRIEND});
        } else {
            hostiles = findAtPos.findInRange(FIND_HOSTILE_CREEPS, range, {filter: (s) => Intel.getDiplomatics(s.owner.username) != Intel.FRIEND});
            structures = findAtPos.findInRange(FIND_HOSTILE_STRUCTURES, range, {
                filter: (s)=>(s.structureType == STRUCTURE_TOWER || 
                    s.structureType == STRUCTURE_SPAWN ||
                    s.structureType == STRUCTURE_INVADER_CORE) && 
                    Intel.getDiplomatics(s.owner.username) != Intel.FRIEND});
                
            if (hostiles.length > 0) {
                hostiles = hostiles[0];
            }
            if (structure.length > 0) {
                structures = structures[0];
            }
        }
        
        if (hostiles)
        {
            creep.memory.target = hostiles.id;
        } else if (structures) {
            creep.memory.target = structures.id;
        } else {
            //no targets - move home
            delete creep.memory.target;
            //delete creep.memory.troom;
        }
    }, 
    
    healSelf: function(creep)
    {
        //heal self function
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        } else {
            //heal others
            var targets = creep.pos.findInRange(FIND_MY_CREEPS, 1, {filter: (s) => s.hits < s.hitsMax });
            if (targets.length > 0) {
                creep.heal(targets[0]);
            }
        }
    }, 
    
    
    attackDetection: function(creep, leader)
    {
        // attacked timer is now autoset
        
        
        //tell leader
        if (creep.memory.attacked_time && leader) {
            if (creep.memory.attacked_time > leader.memory.attacked_time) {
                leader.memory.attacked_time = creep.memory.attacked_time;
            }
        }
        
    }, 
    
    
    addFollower: function(leader, follower)
    {
        if (!leader.memory.grp_follow) {
            leader.memory.grp_follow = [];
        }
        
        var index = _.findIndex(leader.memory.grp_follow, (s) => s == follower.id);
        if (index < 0) {
            leader.memory.grp_follow.push(follower.id);
        }
    }, 
    
    checkFollower: function(creep)
    {
        if (!creep.memory.grp_follow) {
            return;
        }
        
        for (var i in creep.memory.grp_follow) {
            var follower = Game.getObjectById(creep.memory.grp_follow[i]);
            if (!follower || follower.id == creep.id) {
                //remove follower from list
                creep.memory.grp_follow.splice(i, 1);
                return this.checkFollower(creep);
            }
        }
    }, 
    
    
    getLeader: function(creep) 
    {
        //leader = self
        if (creep.memory.grp_lead == 'self') {
            return creep;
        }
        //leader = other creep
        var ldr = Game.getObjectById(creep.memory.grp_lead);
        if (ldr) {
            this.addFollower(ldr, creep);
            return ldr;
        }
        
        //search for new leader
        var leader = _.find(Game.creeps, (s) => {
            return s.memory.grp != null && 
                s.memory.grp == creep.memory.grp &&
                s.memory.grp_lead == 'self';
        });
        
        if (leader) {
            creep.memory.grp_lead = leader.id;
            return leader;
        } else {
            //set leader as self
            creep.memory.grp_lead = 'self';
            return creep;
        }
    }, 
};