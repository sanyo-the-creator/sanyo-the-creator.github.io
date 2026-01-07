export interface Article {
  id: string;
  title: string;
  subtitle: string;
  mainImage: string;
  htmlContentPath: string;
  slug: string;
  publishedDate?: string;
  modifiedDate?: string;
}

export interface ArticleContent {
  title: string;
  subtitle: string;
  mainImage: string;
  htmlContent: string;
}
