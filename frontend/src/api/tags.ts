import client from './client';
import type { Tag, ApiResponse } from '../types';


export async function getTags(): Promise<Tag[]> {
  const response = await client.get<ApiResponse<Tag[]>>('/tags');
  return response.data.data!;
}