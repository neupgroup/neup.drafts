import Link from "next/link";

interface RelatedPost {
  id: string;
  title: string;
  slug?: string;
  authorDisplayName?: string;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="border-t border-slate-200 pt-12 pb-16">
      <h3 className="text-2xl font-serif font-medium text-slate-900 mb-6">
        Related Stories
      </h3>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.slug || post.id}`}
            className="group block space-y-2 border border-slate-200 p-4 rounded-lg hover:border-slate-400 transition-colors bg-white"
          >
            <h4 className="font-serif font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
              {post.title}
            </h4>
            <p className="text-xs text-slate-500 font-mono">
              By {post.authorDisplayName || "Anonymous"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
