/**
 * @author Petrus J Pretorius
 */

//stat helper
calcStat = function(statMod,baseStat){
    return statMod*(baseStat.M-baseStat.m)+baseStat.m;
}

var creatureClasses =  {
    'G': {
        name:'Grolbar',
        desc:'Boss dude. He doesn\'t think much of you, and someone said he said something about you that wasn\t very nice.',
        stats:{
            hp:{M:100,m:100},
            dex:{M:100,m:100},
            str:{M:100,m:100},
            spd:{M:45,m:45},
            },
        defWep:'p'
        },
    'g': {
        name:'Grolbar\'s dude',
        desc:'Boss dude\'s dude. He seems unfriendly in a homicidal kind of way.',
        stats:{
            hp:{M:80,m:20},
            dex:{M:80,m:20},
            str:{M:80,m:20},
            spd:{M:40,m:20},
            },
        defWep:'p'
        },
    'd': {
        name:'War wolf',
        desc:'Nasty dog with shiny coat and a healthy wet nose.',
        stats:{
            hp:{M:50,m:10},
            dex:{M:60,m:10},
            str:{M:20,m:10},
            spd:{M:70,m:30},
            },
        arm: false,
        wear: false,
        defWep:'M'
        },
    'z': {
        name:'Zombie',
        desc:'This is a zombie. For real.',
        stats:{
            hp:{M:50,m:10},
            dex:{M:15,m:2},
            str:{M:20,m:10},
            spd:{M:35,m:2},
            },
        arm: false,
        wear: false,
        defWep: 'M'
        },
    '@': {
        name:'You',
        desc:'You were born a couple of years ago in the village someplace nearby. You are tall, for a short spirally-blob of medium height. You have an air of command, though no one takes you too seriously.',
        stats:{
            hp:{M:100,m:1},
            dex:{M:100,m:1},
            str:{M:100,m:1},
            spd:{M:100,m:1},
            },
        defWep:'p'
        },
    'U': {
        name:'Unit',
        desc:'This unit is pretty standard for a unit. In groups they are easy to count.',
        stats:{
            hp:{M:90,m:30},
            dex:{M:90,m:30},
            str:{M:90,m:30},
            spd:{M:45,m:25},
            },
        defWep:'p'
    }
}
/*
dp = damage points
fa = firing accuracy (arc size in radians)
clp = clip size
fr = fire rate (shots/sec)
rl = reload time (seconds)
*/
weaponClasses = {
    ')' : {
        name: 'Bow',
        desc: 'Sturdy long rage weapon with a slow rate of fire.',
        dp: {M:15,m:7},
        fa: {M:0.01,m:0.1},
        fr:{M:0.9,m:0.4},
        ammo : '|',
        wepExt:0.6,
        size:60,
        rotOffset:Math.PI/2
        },
    'f' : {
        name: 'Revolver',
        desc: 'Long rage weapon with a slow rate of fire.',
        dp: {M:25,m:10},
        fa: {M:0.03,m:0.2},
        fr:{M:4.9,m:2.4},
        clip:{M:14,m:6},
        rl:{M:1,m:3},
        ammo : '\'',
        wepExt:0.4,
        size:30,
        rotOffset:Math.PI
        },
    'F' : {
        name: 'MP40',
        desc: 'Deadly spray&pray weapon.',
        dp: {M:18,m:4},
        fa: {M:0.09,m:0.6},
        fr:{M:11.0,m:7.0},
        clip:{M:40,m:20},
        rl:{M:1,m:2.5},
        ammo : '\'',
        wepExt:0.4,
        size:45,
        rotOffset:Math.PI
        },
    '!' : {
        name: 'Club',
        desc: 'Unweildy, dangerous wooden thing.',
        dp: {M:15,m:6},
        fr: {M:1.5,m:0.8},
        wepExt:1.3,
        size:50
        },
    '/' : {
        name: 'Sword',
        desc: 'Sharp deadly weapon.',
        dp: {M:50,m:15},
        fr: {M:1.2,m:0.5},
        wepExt:1.4,
        size:50
        },
    'p' : {
        name: 'Fist',
        desc: 'Hand made into a ball and thrust at opponent.',
        dp: {M:8,m:3},
        fr: {M:1.7,m:1.5},
        wepExt:1.1,
        size:25
        },
    'M' : {
        name: 'Mouth',
        desc: 'Nom.',
        dp: {M:19,m:8},
        fr: {M:1.7,m:1},
        wepExt:1,
        size:20
        },

}

ammoClasses = {
    '|' : {
        name: 'Arrow',
        desc: 'Small thin stick with metal head and feathered rear. Ammo for bows.',
        dp:{M:7,m:3},
        spd:{M:60,m:40}
        },
    '\'':{
        name: 'Bullet',
        desc: 'Metal slug. Ammo for guns.',
        dp:{M:10,m:3},
        spd:{M:100,m:70}
        }
}

pickupClasses = {
    '$' : {
        name: 'Money',
        desc: 'Blingedy-bling',
        value:{M:100,m:1},
        }
}

armourClasses = {
    'L' : {
        name: 'Leather armour',
        desc: 'This armour is made from Leather. Slight protection with zero movement penalty',
        ap: 0.25,
        enc: 1.0
        },
    'M' : {
        name: 'Mail armour',
        desc: 'This armour is made from woven rings or iron. Good proteclion with slight movement penalty',
        ap: 0.5,
        enc: 1.2
        },
    'S' : {
        name: 'Steel plate armour',
        desc: 'This armour is plated steel. It deflects most damage but slows the wearer down considerably',
        ap: 0.8,
        enc: 1.7
        },
}