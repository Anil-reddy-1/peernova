'use client';

import { useState, useRef, useCallback } from 'react';
import { useTutors } from '@/hooks/useTutors';
import Link from 'next/link';

export default function DiscoverPage() {
  const [subject, setSubject] = useState('');
  const [minRating] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useTutors({ subject, minRating, maxPrice });

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Discover Tutors</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search subject..."
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Price (₹)"
            className="input w-32"
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading tutors...</div>
      ) : isError ? (
        <div className="text-center py-10 text-red-500">Failed to load tutors.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.pages.map((page, i) =>
            page.data.map((tutor, index) => {
              const isLast = page.data.length === index + 1 && i === data.pages.length - 1;
              return (
                <div
                  ref={isLast ? lastElementRef : null}
                  key={tutor.userId}
                  className="glass-card rounded-2xl p-6 hover-lift flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center text-2xl">
                      {(tutor as any).displayName?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{(tutor as any).displayName || 'Tutor'}</h3>
                      <div className="flex items-center gap-1 text-sm text-surface-500">
                        <span>⭐ {tutor.rating?.toFixed(1) || 'New'}</span>
                        <span>•</span>
                        <span>{tutor.reviewCount || 0} reviews</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mb-4">
                    {tutor.bio || 'No bio provided.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tutor.subjects?.slice(0, 3).map((sub: any) => (
                      <span key={sub.name} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                        {sub.name}
                      </span>
                    ))}
                    {tutor.subjects?.length > 3 && (
                      <span className="px-2 py-1 bg-surface-200 text-surface-600 text-xs rounded-md">
                        +{tutor.subjects.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-800">
                    <div>
                      <span className="font-bold text-lg">₹{tutor.hourlyRate}</span>
                      <span className="text-xs text-surface-500">/hr</span>
                    </div>
                    <Link
                      href={`/dashboard/tutors/${tutor.userId}`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      
      {isFetchingNextPage && <div className="text-center py-4">Loading more...</div>}
    </div>
  );
}
