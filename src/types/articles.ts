export interface Article {
  id: string;
  title: string;
  subtitle: string;
  mainImage: string;
  htmlContentPath: string;
  slug: string;
}

export interface ArticleContent {
  title: string;
  subtitle: string;
  mainImage: string;
  htmlContent: string;
}
