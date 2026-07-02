import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, User, ArrowRight, Home } from "lucide-react";
import { format } from "date-fns";
import type { BlogArticle } from "@shared/schema";

export default function Blog() {
  const { data: articles, isLoading } = useQuery<BlogArticle[]>({
    queryKey: ["/api/blog"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Return to Home Link */}
          <div className="mb-4">
            <Link href="/">
              <a className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors">
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </a>
            </Link>
          </div>
          
          <h1 className="text-4xl font-heading font-bold text-gray-900">Education Hub</h1>
          <p className="mt-2 text-xl text-gray-600">
            Expert tips, training insights, and athletic development advice from the Power2ADAPT coaches
          </p>
          
          {/* Skool Community Link */}
          <div className="mt-6">
            <a 
              href="https://www.skool.com/power2adapt-speed-school-8929" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <div className="flex items-center justify-center w-5 h-5 text-sm font-bold border border-white rounded mr-2">
                S
              </div>
              Join Our Skool Community
              <ArrowRight className="ml-2 w-4 h-4" />
            </a>
            <p className="mt-2 text-sm text-gray-500">
              Connect with other parents, get exclusive content, and ask questions directly to our coaches
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Skool Community CTA Section */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-full mx-auto mb-6">
              <div className="flex items-center justify-center w-10 h-10 text-lg font-bold border-2 border-white rounded text-white">
                S
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              Join Our Exclusive Community
            </h2>
            
            <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
              Connect with other Power2ADAPT families, access exclusive training content, get personalized coaching advice, and stay updated on the latest athletic development strategies.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                <h3 className="font-semibold text-gray-900 mb-1">Parent Network</h3>
                <p className="text-sm text-gray-600">Connect with other families on the same athletic journey</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-1">Expert Coaching</h3>
                <p className="text-sm text-gray-600">Direct access to our professional coaches for questions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📚</div>
                <h3 className="font-semibold text-gray-900 mb-1">Exclusive Content</h3>
                <p className="text-sm text-gray-600">Training videos, tips, and resources not available elsewhere</p>
              </div>
            </div>
            
            <a 
              href="https://www.skool.com/power2adapt-speed-school-8929" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center w-6 h-6 text-sm font-bold border border-white rounded mr-3">
                S
              </div>
              Join Skool Community Now - It's Free!
              <ArrowRight className="ml-3 w-5 h-5" />
            </a>
            
            <p className="mt-4 text-sm text-gray-500">
              Join 200+ parents already getting the best athletic development insights
            </p>
          </div>
        </div>
      </div>

      {/* Blog Articles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!articles || articles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
              Coming Soon!
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Our coaches are preparing amazing content about athletic development, training tips, and sports performance. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {article.featuredImage && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    <time dateTime={new Date(article.publishedAt || article.createdAt || Date.now()).toISOString()}>
                      {format(new Date(article.publishedAt || article.createdAt || Date.now()), 'MMM d, yyyy')}
                    </time>
                  </div>
                  
                  <h2 className="text-xl font-heading font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    <Link href={`/blog/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h2>
                  
                  {article.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                  
                  <Link 
                    href={`/blog/${article.slug}`}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Read more
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
