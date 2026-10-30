const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const root=process.env.SOURCE_ROOT||process.cwd();
function application(path,values={}) {
 const html=readFileSync(join(root,path),'utf8');
 const nodes={};
 const defaults={parentName:'Test Parent',parentEmail:'test@example.invalid',parentPhone:'0400000000',athleteName:'Test Athlete',athleteDob:'2015-08-01',athleteSchoolYear:'Year 6',q15:'Existing notes'};
 for(const [id,value] of Object.entries({...defaults,...values})) {
  const field={classList:{add(){},remove(){}},querySelector(){return {textContent:''}}};
  nodes[id]={value,checked:true,closest(){return field},classList:field.classList};
 }
 const document={addEventListener(){},getElementById(id){return nodes[id]||(nodes[id]={value:'test',checked:true,style:{}})},querySelector(selector){return selector.includes(':checked')?{value:'test'}:null},querySelectorAll(){return []}};
 let payload;
 class FixedDate extends Date {constructor(...args){super(...(args.length?args:['2026-10-31T12:00:00Z']))}}
 const context={document,Date:FixedDate,window:{scrollTo(){}},alert(){},fetch(_url,options){payload=JSON.parse(options.body);return {then(){return {catch(){}}}}}};
 vm.createContext(context);
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) if(!/\bsrc\s*=/.test(match[1])) vm.runInContext(match[2],context);
 return {context,html,payload:()=>payload};
}
for(const path of ['client/public/junior-academy-application.html','public/junior-academy-application.html']) {
 test(path+': Year 6 athlete aged 11 can progress',()=>assert.equal(application(path).context.validateStep(1),true));
 test(path+': school year is required',()=>assert.equal(application(path,{athleteSchoolYear:'',athleteDob:'2013-08-01'}).context.validateStep(1),false));
 test(path+': individual exception request can progress',()=>assert.equal(application(path,{athleteSchoolYear:'Other / individual exception',athleteDob:'2009-08-01'}).context.validateStep(1),true));
 test(path+': future date of birth is rejected',()=>assert.equal(application(path,{athleteDob:'2027-01-01'}).context.validateStep(1),false));
 test(path+': existing required contact details remain required',()=>assert.equal(application(path,{parentName:'',athleteDob:'2013-08-01'}).context.validateStep(1),false));
 test(path+': school year and original notes reach existing payload',()=>{const app=application(path);app.context.submitForm();assert.match(app.payload().coachNotes,/School year: Year 6/);assert.match(app.payload().coachNotes,/Existing notes/)});
}
