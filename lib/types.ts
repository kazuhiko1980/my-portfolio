export type WorkType = "image" | "video";

export type Category = {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Work = {
  id: string;
  title: string;
  type: WorkType;
  image_url: string | null;
  youtube_url: string | null;
  description: string | null;
  category_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
};

export type WorkWithCategory = Work & {
  category: Category | null;
};

export type WorkFormInput = {
  title: string;
  type: WorkType;
  image_url: string | null;
  youtube_url: string | null;
  description: string | null;
  category_id: string | null;
  display_order: number;
};
