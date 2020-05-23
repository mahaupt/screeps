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

*/

var roleSoldier = {
    run: function(creep) {
        baseCreep.init(creep);
        
        var leader = roleSoldier.getLeader(creep);
        
        roleSoldier.healSelf(creep);
        if (creep.memory.grp_lead == 'self')
        {
            creep.say('⭐');
            roleSoldier.leader(creep);
        } else {
            roleSoldier.sheep(creep, leader);
        }
        
    }, 
    
    
    sheep: function(creep, leader)
    {
        //copy leader memory
        creep.memory.troom = leader.memory.troom;
        creep.memory.target = leader.memory.target;
        
        if (leader.memory.target) 
        {
            var target = Game.getObjectById(leader.memory.target);
            if (target)
            {
                roleSoldier.attack(creep, target);
                return;
            }
        }
        //follow leader
        creep.moveTo(leader);
    }, 
    
    leader: function(creep)
    {
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
            }
            return;
        }
        
        
        if (creep.room.name == creep.memory.troom) {
            //go destroy target
            if (!creep.memory.target) {
                roleSoldier.pickTarget(creep);
            }
            var target = Game.getObjectById(creep.memory.target);
            if (target) {
                roleSoldier.attack(creep, target);
            }
        } else {
            if (Game.time % 5 == 0) return;
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
        var target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        if (target)
        {
            creep.memory.target = target.id;
        } else {
            //no targets - move home
            delete creep.memory.target;
            delete creep.memory.troom;
        }
    }, 
    
    healSelf: function(creep)
    {
        //heal self function
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
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

module.exports = roleSoldier;