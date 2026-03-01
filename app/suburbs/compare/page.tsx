import { SuburbComparison2 } from '@/components/calculators/SuburbComparison2';
import { getSuburbsForComparison } from '@/lib/suburbs';
import { notFound } from 'next/navigation';

export const revalidate = 86400;

export default async function SuburbComparePage({ searchParams }: { searchParams: { [key: string]: string } }) {
  const sub1 = searchParams?.sub1 || '';
  const sub2 = searchParams?.sub2 || '';
  const sub3 = searchParams?.sub3 || '';
  const slugs = [sub1, sub2, sub3].filter(Boolean);
  if (slugs.length === 0) return notFound();
  const suburbs = getSuburbsForComparison(slugs);

  return (
    <SuburbComparison2
      initialSuburb1={sub1}
      initialSuburb2={sub2}
      initialSuburb3={sub3}
      suburbs={suburbs}
    />
  );
}
