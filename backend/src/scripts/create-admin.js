'use strict';
require('dotenv').config();
var Pool=require('pg').Pool, bcrypt=require('bcryptjs'), readline=require('readline');
var pool=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:8000});
var ROLES=['super_admin','admin','finance','ops','crm','gate','sales','partner','reseller','ta'];
var DEFAULT_STAFF=[
  {email:'rajesh@wow.in',    password:'wow@2025',name:'Rajesh Kumar',   role:'admin'},
  {email:'priya.fin@wow.in', password:'wow@2025',name:'Priya Verma',    role:'finance'},
  {email:'vikram.ops@wow.in',password:'wow@2025',name:'Vikram Ops',     role:'ops'},
  {email:'sneha.crm@wow.in', password:'wow@2025',name:'Sneha CRM',      role:'crm'},
  {email:'ravi.gate@wow.in', password:'wow@2025',name:'Ravi Gate',      role:'gate'},
  {email:'sanjay@wow.in',    password:'wow@2025',name:'Sanjay Sales',   role:'sales'},
  {email:'akm@indiagully.com',password:'wow@2025',name:'AKM SuperAdmin',role:'super_admin'}
];
function ask(q,def){
  var rl=readline.createInterface({input:process.stdin,output:process.stdout});
  return new Promise(function(res){rl.question((def!==undefined?q+' ['+def+']: ':q+': '),function(a){rl.close();res(a.trim()||def||'');});});
}
function parseCLI(){var a={},v=process.argv.slice(2);for(var i=0;i<v.length;i++){if(v[i].startsWith('--')){a[v[i].slice(2)]=v[i+1];i++;}}return a;}
async function upsert(client,u){
  var h=await bcrypt.hash(u.password,12);
  var r=await client.query(
    'INSERT INTO staff_users (email,password_hash,name,role,active) VALUES ($1,$2,$3,$4,true) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,role=EXCLUDED.role,active=true,updated_at=NOW() RETURNING id,email,name,role',
    [u.email.toLowerCase().trim(),h,u.name,u.role]);
  return r.rows[0];
}
async function main(){
  console.log('\n====================================================');
  console.log('  WOW Staff User Management  (create-admin.js)');
  console.log('====================================================\n');
  if(!process.env.DATABASE_URL){console.error('  ERROR: DATABASE_URL not set in .env\n');process.exit(1);}
  var client;
  try{client=await pool.connect();console.log('  Connected to PostgreSQL\n');}
  catch(e){console.error('  Cannot connect:',e.message,'\n');process.exit(1);}
  var tbl=(await client.query("SELECT to_regclass('public.staff_users') AS t")).rows[0].t;
  if(!tbl){console.error('  Run: npm run migrate\n');client.release();await pool.end();process.exit(1);}
  var cnt=parseInt((await client.query('SELECT count(*) AS c FROM staff_users')).rows[0].c,10);
  console.log('  Existing staff users: '+cnt+'\n');
  var cli=parseCLI();
  if(cli.email&&cli.password){
    if(ROLES.indexOf(cli.role||'admin')===-1){console.error('  Invalid role\n');client.release();await pool.end();process.exit(1);}
    var u=await upsert(client,{email:cli.email,password:cli.password,name:cli.name||cli.email,role:cli.role||'admin'});
    console.log('  Created: '+u.email+' ('+u.role+')\n');
    client.release();await pool.end();return;
  }
  console.log('  1) Seed all 7 default staff users\n  2) Create/reset single user\n  3) List users\n  4) Exit\n');
  var c=await ask('  Choice','1');
  if(c==='1'){
    console.log('\n  Seeding...\n');
    for(var i=0;i<DEFAULT_STAFF.length;i++){
      try{var cr=await upsert(client,DEFAULT_STAFF[i]);console.log('  OK  '+cr.email.padEnd(25)+' '+cr.role);}
      catch(e){console.error('  ERR '+DEFAULT_STAFF[i].email+': '+e.message);}
    }
    console.log('\n  Default credentials (change in production):');
    DEFAULT_STAFF.forEach(function(u){console.log('  '+u.email.padEnd(26)+' wow@2025  '+u.role);});
    console.log('\n  Test: $r = Invoke-RestMethod https://worlds-of-wonder-production.up.railway.app/api/auth/login -Method Post -ContentType "application/json" -Body \'{"email":"rajesh@wow.in","password":"wow@2025"}\'');
    console.log('  $token = $r.token\n');
  } else if(c==='2'){
    var email=await ask('  Email'),name=await ask('  Name'),role=await ask('  Role ('+ROLES.join(',')+')', 'admin'),pw=await ask('  Password');
    if(!email||!pw){console.error('  Email+password required.\n');client.release();await pool.end();process.exit(1);}
    var cr2=await upsert(client,{email:email,password:pw,name:name||email,role:role});
    console.log('\n  Created: '+cr2.email+' ('+cr2.role+')\n');
  } else if(c==='3'){
    var rows=(await client.query('SELECT email,name,role,active FROM staff_users ORDER BY role,email')).rows;
    if(!rows.length){console.log('\n  No users. Run option 1.\n');}
    else{console.log('\n  Users:\n');rows.forEach(function(u){console.log('  '+u.email.padEnd(28)+u.role.padEnd(14)+(u.active?'active':'inactive'));});console.log('');}
  } else { console.log('\n  Bye!\n'); }
  client.release();await pool.end();
}
main().catch(function(e){console.error('\n  Error:',e.message,'\n');process.exit(1);});
