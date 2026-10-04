export type GitHubAccount = {configured:boolean;connected:boolean;username?:string;avatar?:string;botInstallUrl?:string};
export type GitHubPR = {ticket_id?:string;pr_number:number;url:string;state:string;review_status:string;review_body:string;approved:boolean;merged:boolean};
export type GitHubWorkspace = {name?:string;url?:string;branches:{ticket:string;branch:string}[];pullRequests:GitHubPR[];webhookConfigured:boolean};
export async function githubRequest<T>(path:string,method='GET',body?:unknown):Promise<T>{
  const base=(process.env.NEXT_PUBLIC_API_URL||'http://localhost:8080/api/v1').replace(/\/$/,'');
  const response=await fetch(`${base.endsWith('/api/v1')?base:base+'/api/v1'}/github${path}`,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('vc_token')||''}`},...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json();if(!response.ok)throw new Error(result.message||'GitHub request failed');return result.data;
}
