"use strict";(()=>{var e={};e.id=674,e.ids=[674],e.modules={9281:e=>{e.exports=require("ibm-cloud-sdk-core")},4558:e=>{e.exports=require("next/config")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},2112:e=>{e.exports=import("@ibm-cloud/watsonx-ai")},9648:e=>{e.exports=import("axios")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,a){return a in t?t[a]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,a)):"function"==typeof t&&"default"===a?t:void 0}}})},5279:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.r(t),a.d(t,{config:()=>u,default:()=>l,routeModule:()=>d});var r=a(1802),o=a(7153),s=a(6249),i=a(7925),c=e([i]);i=(c.then?(await c)():c)[0];let l=(0,s.l)(i,"default"),u=(0,s.l)(i,"config"),d=new r.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/guidance",pathname:"/api/guidance",bundlePath:"",filename:""},userland:i});n()}catch(e){n(e)}})},7925:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.r(t),a.d(t,{default:()=>i});var r=a(7253),o=a(763),s=e([r,o]);async function i(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let a=e.body;if(!a?.deal?.product||!a?.deal?.stage||!a?.deal?.industry)return t.status(400).json({error:"Missing required deal fields: product, stage, industry"});let{deal:n,question:s}=a;try{let e=[n.product,n.industry,n.stage].join(" "),[a,i]=await Promise.all([(0,r.Iy)(e),n.competitor?(0,r.hj)(n.competitor):Promise.resolve([])]),c=[...a,...i],l=await (0,o.Z)(n,c,s);return t.status(200).json({dealId:n.id??`deal-${Date.now()}`,recommendations:l,askSalesResults:c})}catch(e){return console.error("[Guidance API route error]",e),t.status(500).json({error:"Failed to generate guidance"})}}[r,o]=s.then?(await s)():s,n()}catch(e){n(e)}})},763:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.d(t,{Z:()=>l});var r=a(2112),o=a(9281),s=a(4558),i=a.n(s),c=e([r]);r=(c.then?(await c)():c)[0];let{serverRuntimeConfig:u}=i()(),d=u.watsonxModel??"ibm/granite-13b-chat-v2",p=u.watsonxProjectId;async function l(e,t,a){let n=r.WatsonXAI.newInstance({version:"2024-05-31",serviceUrl:u.watsonxUrl,authenticator:new o.IamAuthenticator({apikey:u.watsonxApiKey})}),s=t.map(e=>`- ${e.title}: ${e.excerpt}`).join("\n"),i=`You are an IBM sales expert assistant. Given the following deal details and IBM AskSales content, provide 3-5 specific, actionable sales recommendations.

Deal Details:
- Product: ${e.product}
- Stage: ${e.stage}
- Industry: ${e.industry}
${e.competitor?`- Competitor: ${e.competitor}`:""}
${e.dealSize?`- Deal Size: $${e.dealSize.toLocaleString()}`:""}
${e.notes?`- Seller Notes: ${e.notes}`:""}
${a?`
Seller Question: ${a}`:""}

Relevant IBM AskSales Content:
${s||"No specific content retrieved."}

Respond with a JSON array of recommendations. Each recommendation must have:
- id (string)
- type (one of: NEXT_STEP, TALK_TRACK, PLAYBOOK, OBJECTION_RESPONSE, COMPETITIVE_INTEL, RESOURCE_LINK)
- title (string, short)
- summary (string, one sentence)
- content (string, detailed guidance)
- source ("AI_GENERATED" or "COMBINED" if using AskSales content)
- confidence (number 0.0-1.0)
- actions (array of { label, type } objects)

Return only valid JSON, no markdown.`,c=await n.generateText({modelId:d,projectId:p,input:i,parameters:{max_new_tokens:1500,temperature:.3}}),l=c.result.results?.[0]?.generated_text??"[]";try{return JSON.parse(l)}catch{return[{id:"fallback-1",type:"NEXT_STEP",title:"Review AskSales content",summary:"AI response could not be parsed. Review AskSales results directly.",content:l,source:"AI_GENERATED",confidence:.5,actions:[]}]}}n()}catch(e){n(e)}})},7253:(e,t,a)=>{a.a(e,async(e,n)=>{try{a.d(t,{Iy:()=>c,Qy:()=>l,hj:()=>d,v1:()=>u});var r=a(9648),o=a(4558),s=a.n(o),i=e([r]);r=(i.then?(await i)():i)[0];let{serverRuntimeConfig:p}=s()(),m=r.default.create({baseURL:p.askSalesApiUrl,headers:{Authorization:`Bearer ${p.askSalesApiKey}`,"Content-Type":"application/json",Accept:"application/json"}});async function c(e){return(await m.get("/search",{params:{q:e}})).data.results??[]}async function l(e){return(await m.post("/query",{question:e})).data.answer??""}async function u(e){return(await m.get(`/playbooks/${e}`)).data??null}async function d(e){return(await m.get("/competitive",{params:{q:e}})).data.results??[]}n()}catch(e){n(e)}})},7153:(e,t)=>{var a;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return a}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(a||(a={}))},1802:(e,t,a)=>{e.exports=a(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var a=t(t.s=5279);module.exports=a})();