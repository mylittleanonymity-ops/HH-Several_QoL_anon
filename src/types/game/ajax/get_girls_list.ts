import { CompleteGirl } from "../girls";

export type GetGirlsListResponse = {
  girls_list: CompleteGirl[];
  current_page: number;
  total_pages: number;
  success: boolean;
};
