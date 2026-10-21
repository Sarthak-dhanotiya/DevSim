export type GitHubAccount = {configured:boolean;connected:boolean;username?:string;avatar?:string;botInstallUrl?:string};
export type GitHubPR = {ticket_id?:string;pr_number:number;url:string;state:string;review_status:string;review_body:string;approved:boolean;merged:boolean};
export type GitHubWorkspace = {name?:string;url?:string;branches:{ticket:string;branch:string}[];pullRequests:GitHubPR[];webhookConfigured:boolean};
export function pullRequestStatus(pr: GitHubPR) {
  const green = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
  const neutral = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  const amber = 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
  if (pr.merged) return {label: pr.approved ? 'Reviewed & merged' : 'Merged', className: pr.approved ? green : neutral};
  if (pr.state === 'closed') return {label: 'Closed', className: neutral};
  if (pr.approved) return {label: 'Approved', className: green};
  if (pr.review_status === 'POSTED') return {label: 'Changes requested', className: amber};
  if (pr.review_status === 'TOO_LARGE') return {label: 'Split PR for review', className: amber};
  if (pr.review_status === 'RETRY_REQUIRED') return {label: 'Review needs retry', className: amber};
  if (pr.review_status === 'STALE') return {label: 'New commits to review', className: amber};
  return {label: 'Waiting for review', className: neutral};
}
export async function githubRequest<T>(path:string,method='GET',body?:unknown):Promise<T>{
  const base=(process.env.NEXT_PUBLIC_API_URL||'http://localhost:8080/api/v1').replace(/\/$/,'');
  const response=await fetch(`${base.endsWith('/api/v1')?base:base+'/api/v1'}/github${path}`,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('vc_token')||''}`},...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json();if(!response.ok)throw new Error(result.message||'GitHub request failed');return result.data;
}
