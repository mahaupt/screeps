/*
Memory Layout
role = 'soldier'
home = home room name
grp = group.id
grp_lead = creep.id / 'self'

troom = room name to start attack
tx = xcord of target
ty = ycord of target

target - object id of attack target
passive = true/false
*/

module.exports = {
    name: 'soldier', 
    boost_res: ['GO', 'KO', 'ZO'], 
    run: function(creep) {
        baseCreep.init(creep);
        
        var leader = this.getLeader(creep);
        
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
        creep.memory.troom = leader.memory.troom;
        creep.memory.tx = leader.memory.tx;
        creep.memory.ty = leader.memory.ty;
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
                //prepared - search for boost
                baseCreep.boostCreep(creep, this.boost_res);
            }
            return;
        } else if (!creep.memory.troom) {
            delete creep.memory.embark;
        }
        
        //follow leader
        creep.moveTo(leader);
    }, 
    
    leader: function(creep)
    {
        //target
        if (creep.memory.target) {
            var target = Game.getObjectById(creep.memory.target);
            if (target) {
                this.attack(creep, target);
                return;
            } else {
                delete creep.memory.target;
            }
        }
        
        //no target room - go home
        if (!creep.memory.troom) 
        {
            if (creep.room.name != creep.memory.home) {
                baseCreep.moveToRoom(creep, creep.memory.home);
            }
            else 
            {
                //idle around controller
                creep.say("😴");
                creep.moveTo(creep.room.controller);
                this.pickTarget(creep);
            }
            delete creep.memory.embark;
            return;
        }
        
        
        //if target room - prepare for embarkation
        if (!creep.memory.embark) {
            if (Game.time % 5 == 0) return; //slow down
            if (baseCreep.prepareCreep(creep)) {
                //prepared - search for boost
                baseCreep.boostCreep(creep, this.boost_res);
            }
            return;
        }
        
        //move to target room
        if (creep.room.name == creep.memory.troom) {
            //go destroy target
            if (!creep.memory.target && !creep.memory.passive) {
                this.pickTarget(creep);
            }
            
            //move in position
            if (creep.memory.tx && creep.memory.ty) {
                var pos = new RoomPosition(creep.memory.tx, creep.memory.ty, creep.room.name);
                creep.moveTo(pos);
                creep.say("🛡️");
            }
        } else {
            if (Game.time % 5 == 0) return; //slow down
            baseCreep.moveToRoom(creep, creep.memory.troom);
        }
    }, 
    
    attack: function(creep, target)
    {
        creep.say("⚔️");
        
        var range = creep.pos.getRangeTo(target);
        if (range > 1) {
            creep.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
        }
        if (range <= 3) {
            creep.rangedMassAttack();
        }
    }, 
    
    pickTarget: function(creep)
    {
        var hostiles = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        var structure = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
            filter: (s)=>s.structureType == STRUCTURE_TOWER || s.structureType == STRUCTURE_SPAWN});
        
        if (hostiles)
        {
            creep.memory.target = hostiles.id;
        } else if (structure) {
            creep.memory.target = structure.id;
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
    
    
    getLeader: function(creep) 
    {
        //leader = self
        if (creep.memory.grp_lead == 'self') {
            return creep;
        }
        //leader = other creep
        var ldr = Game.getObjectById(creep.memory.grp_lead);
        if (ldr) {
            return ldr;
        }
        
        //search for new leader
        var leader = _.find(Game.creeps, (s) => {
            return s.memory.grp == creep.memory.grp &&
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