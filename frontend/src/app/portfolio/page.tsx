import { DeveloperPortfolio } from '@/components/common/DeveloperPortfolio';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sarthak Dhanotiya | Java Backend Engineer', description: 'Java Backend Engineer building secure microservices, event-driven systems and multi-tenant SaaS applications. Explore experience, selected work and technical skills.' };
export default function PortfolioPage() {
  return <div className="w-full portfolio-standalone"><DeveloperPortfolio /></div>;
}
