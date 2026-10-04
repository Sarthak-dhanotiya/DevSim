import {DeveloperPortfolio} from '@/components/common/DeveloperPortfolio';
export default function Page({params}:{params:{id:string}}){return <main className="max-w-4xl mx-auto p-6"><DeveloperPortfolio studentId={params.id}/></main>;}
