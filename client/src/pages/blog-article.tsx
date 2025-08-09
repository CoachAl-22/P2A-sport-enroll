import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Calendar, ArrowLeft, User } from "lucide-react";
import { format } from "date-fns";
import type { BlogArticle } from "@shared/schema";

export default function BlogArticle() {
  const [match, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const { data: article, isLoading, error } = useQuery<BlogArticle>({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-4">The article you're looking for doesn't exist.</p>
          <Link href="/blog" className="text-primary-600 hover:text-primary-700">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <Link 
          href="/blog" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8 font-medium transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Education Hub
        </Link>

        {/* Article Header */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {article.featuredImage && (
            <div className="aspect-[21/9] overflow-hidden">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Article Meta */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Calendar className="w-4 h-4 mr-2" />
              <time dateTime={article.publishedAt || article.createdAt || undefined}>
                {format(new Date(article.publishedAt || article.createdAt || Date.now()), 'MMMM d, yyyy')}
              </time>
            </div>

            {/* Article Title */}
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Article Excerpt */}
            {article.excerpt && (
              <div className="text-xl text-gray-600 mb-8 leading-relaxed">
                {article.excerpt}
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        </article>

        {/* Back to Education Hub Footer */}
        <div className="mt-12 text-center">
          <Link 
            href="/blog" 
            className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Read More Articles
          </Link>
        </div>
      </div>
    </div>
  );
}