'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Input, Spinner, EmptyState } from '@peer-tutoring/ui';
import { Search, UserX } from 'lucide-react';

export default function TutorsPage() {
  useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['tutors', searchTerm, subjectFilter],
    queryFn: async () => {
      const res = await api.tutors.list({
        search: searchTerm || undefined,
        subject: subjectFilter || undefined,
      });
      return res.data;
    },
  });

  const tutors = Array.isArray(response?.data) ? response.data : [];

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Find Tutors</h1>
        <p className="text-surface-500 mt-1">Discover expert peers to help you master any subject.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-surface-400" />
          <Input
            type="text"
            placeholder="Search by name or subject..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 rounded-md border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer h-10"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="">All Subjects</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
          <option value="Computer Science">Computer Science</option>
          <option value="English">English</option>
        </select>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner className="w-8 h-8 text-primary-500" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={UserX}
          title="Error loading tutors"
          description="We couldn't load the tutor directory right now. Please try again later."
        />
      )}

      {/* Tutors Grid */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tutors.map((tutor: any) => {
            // API returns userId as the tutor's unique ID
            const tutorId = tutor.id || tutor.userId;
            return (
              <div key={tutorId} className="glass-card rounded-2xl p-6 hover-lift flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-2xl font-bold text-primary-700 dark:text-primary-300 mb-4 overflow-hidden">
                  {tutor.photoURL ? (
                    <img src={tutor.photoURL} alt={tutor.displayName} className="w-full h-full object-cover" />
                  ) : (
                    tutor.displayName?.charAt(0)?.toUpperCase() || 'T'
                  )}
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">{tutor.displayName || 'Tutor'}</h3>
                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {tutor.subjects?.map((s: any) => s.name).join(', ') || 'General'}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-surface-600 dark:text-surface-400">
                  <span className="flex items-center text-warning-500">⭐ {tutor.rating > 0 ? tutor.rating.toFixed(1) : 'New'}</span>
                  <span>•</span>
                  <span>₹{tutor.hourlyRate || 0}/hr</span>
                </div>
                <Link href={`/dashboard/tutors/${tutorId}`} className="mt-6 w-full py-2 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-900 dark:text-white rounded-xl font-medium transition-colors text-center block">
                  View Profile
                </Link>
              </div>
            );
          })}
          {tutors.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={UserX}
                title="No tutors found"
                description="No tutors match your search criteria. Try adjusting your filters."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
