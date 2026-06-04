'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Board } from '@/types/api';

export interface TemplateCard {
  title?: string;
  labels?: string[];
}
export interface TemplateList {
  title: string;
  cards?: TemplateCard[];
}
export interface Template {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  background?: { type: 'color' | 'gradient'; value: string };
  structure?: {
    labels?: Array<{ name: string; color: string }>;
    lists?: TemplateList[];
  };
  useCount?: number;
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => api<{ items: Template[] }>('/api/templates').then((r) => r.items),
  });
}

export function useCreateBoardFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      workspaceId,
      title,
    }: {
      templateId: string;
      workspaceId: string;
      title: string;
    }) =>
      api<Board>(`/api/boards/from-template/${templateId}`, {
        method: 'POST',
        body: { workspaceId, title },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace-boards'] });
    },
  });
}
