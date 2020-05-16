# cbacon92s Screeps AI
## What is https://screeps.com?
It's an open-source game for programmers, wherein the core mechanic is programming
your units' AI. You control your colony by writing JavaScript.

## Strategy
#### 1. Spawn creeps to be self sufficient
#### 2. Build mining containers and upgrade miners
#### 3. Build extensions to upgrade all creeps
#### 4. Build roads to speed up movement
#### 5. Upgrade controller and build towers for defense


## Roles
### Miner
Mines ressources and carries it to base. If it has its own container next to the ressource it puts the ressource in the container right away. Takes care of his mining container by repairing it. If the container is full, it takes the ressource to the base by itself.
### Hauler
They spawn when mining containers are present. They carry ressources from mining containers to the base. They first try to refill the spawn and extensions, then towers and then Containers and Storages.
### Builder
They repair and construct stuff. If there is nothing left to repair or construct, they become temporary upgraders
### Upgrader
Their only job is to upgrade the controller
### RenewSelf
This is a temporary role which is automatically assigned to a creep when it is about to die. It either renews the creep at the spawn or commits suicide to allow a bigger creep to spawn 


## Roadmap
#### Improve spawning of better creeps
#### Improve efficient building layout
#### Autoplacement of spawns
#### Improve offensive and devensive strategies
#### Implement taking over other rooms
