'use client';
import {useEffect,useRef,useState} from 'react';
export type StageStatus='QUEUED'|'RUNNING'|'SUCCESS'|'FAILED';
export type PipelineResult={approved:boolean;feedback:string;score?:number};
export type PipelineLog={time:string;level:'INFO'|'PASS'|'ERROR';message:string};
export type PipelineStage={name:string;status:StageStatus;duration:number};
const names=['Static analysis','Security scan','Unit tests','Tech Lead review','Build & staging'];
export function usePipelineRunner(run:()=>Promise<PipelineResult>,code:string,mode:'code'|'github'){
 const [stages,setStages]=useState<PipelineStage[]>(names.map(name=>({name,status:'QUEUED',duration:0})));
 const [logs,setLogs]=useState<PipelineLog[]>([]);const [result,setResult]=useState<PipelineResult>();const [status,setStatus]=useState<'RUNNING'|'PASSED'|'FAILED'>('RUNNING');const [elapsed,setElapsed]=useState(0);
 const skip=useRef(false);const started=useRef(false);const callback=useRef(run);callback.current=run;
 useEffect(()=>{let cancelled=false;const start=Date.now();const timer=setInterval(()=>{if(!cancelled)setElapsed((Date.now()-start)/1000);},100);
 const log=(level:PipelineLog['level'],message:string)=>{if(!cancelled)setLogs(v=>[...v,{time:new Date().toLocaleTimeString('en-GB'),level,message}]);};
 const stage=(index:number,value:StageStatus,duration=0)=>{if(!cancelled)setStages(v=>v.map((s,i)=>i===index?{...s,status:value,duration}:s));};
 const delay=async()=>{for(let i=0;i<6&&!skip.current&&!cancelled;i++)await new Promise(r=>setTimeout(r,100));};
 async function execute(){
   let active=0;let stepStart=Date.now();
   try{
    log('INFO','DevSim training pipeline started. Lint, tests and deployment are simulations; completion requires backend approval.');
    for(active=0;active<5;active++){
      if(cancelled)return;stepStart=Date.now();stage(active,'RUNNING');
      if(active===0){log('INFO','Checking submission readiness; displaying simulated lint workflow.');await delay();if(mode==='code'&&(code.trim().length<35||code.includes('// Implement your solution logic here')||code.includes('// Write or paste your implementation code here...')))throw new Error('Replace the starter stub with your implementation before submitting.');log('PASS','Submission readiness passed. Compiler / ESLint / Checkstyle have not been executed.');}
      if(active===1){log('INFO','Checking obvious credential assignments (limited client-side rule).');await delay();if(mode==='code'&&/(?:api[_-]?key|password|secret|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-/.+]{16,}["']/i.test(code))throw new Error('Possible hardcoded credential found. Use environment variables and remove the secret before retrying.');log('PASS','No match in the limited credential rule. Dependency scanning is simulated.');}
      if(active===2){log('INFO','[SIMULATION] Running feature unit tests…');await delay();log('PASS','[SIMULATION] Example test suite: 4/4 passed. Illustrative coverage: 88%. No student code was executed.');}
      if(active===3){log('INFO','Waiting for backend Tech Lead review…');const verdict=await callback.current();if(cancelled)return;setResult(verdict);if(!verdict.approved)throw new Error(verdict.feedback||'Approval is pending or changes were requested.');log('PASS','Backend approved this submission and marked the ticket DONE.');}
      if(active===4){log('INFO','[SIMULATION] Building image devsim/app:ticket-run…');await delay();log('PASS','[SIMULATION] Artifact ready. Staging deployment simulated; no live preview URL is provisioned.');}
      stage(active,'SUCCESS',(Date.now()-stepStart)/1000);
    }
    if(!cancelled){setStatus('PASSED');log('PASS','Pipeline passed. Sprint progress updated from the backend.');}
   }catch(e){if(!cancelled){const feedback=(e as Error).message||'Request failed. Retry after checking connectivity.';stage(active,'FAILED',(Date.now()-stepStart)/1000);log('ERROR',feedback);setResult(v=>v||{approved:false,feedback});setStatus('FAILED');}}
   finally{clearInterval(timer);if(!cancelled)setElapsed((Date.now()-start)/1000);}
 }
 // A cancelled Strict Mode probe must not issue a submission.
 const kickoff=setTimeout(()=>{if(!cancelled&&!started.current){started.current=true;void execute();}},0);
 return()=>{cancelled=true;clearTimeout(kickoff);clearInterval(timer);};
 },[code,mode]);
 return {stages,logs,result,status,elapsed,skip:()=>{skip.current=true;}};
}
