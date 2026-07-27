import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { ReactionButton } from '@/components/ReactionButton';
import { CommentSection } from '@/components/CommentSection';
import HeaderV1S1 from '@/components/header.v1s1';

function getArticleIdFromSlug(slug: string): string {
  const slugParts = slug.split('-');
  return slugParts[slugParts.length - 1] || slug;
}

function getCanonicalArticleSlug(post: { id: string; slug?: string | null }): string {
  if (!post.slug) {
    return post.id;
  }

  return post.slug.endsWith(`-${post.id}`) ? post.slug : `${post.slug}-${post.id}`;
}

function getContentBlocks(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function isHtmlContent(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function sanitizeUrl(value: string): string {
  const trimmedValue = value.trim();

  if (
    trimmedValue.startsWith('data:image/') ||
    trimmedValue.startsWith('data:video/') ||
    trimmedValue.startsWith('data:audio/') ||
    trimmedValue.startsWith('https://') ||
    trimmedValue.startsWith('http://')
  ) {
    return trimmedValue;
  }

  return '';
}

function sanitizeEmbedUrl(value: string): string {
  const trimmedValue = value.trim();

  try {
    const url = new URL(trimmedValue);
    const host = url.hostname.replace(/^www\./, '');

    if (
      (host === 'youtube.com' && url.pathname.startsWith('/embed/')) ||
      (host === 'youtube-nocookie.com' && url.pathname.startsWith('/embed/')) ||
      (host === 'player.vimeo.com' && url.pathname.startsWith('/video/'))
    ) {
      return url.toString();
    }
  } catch {
    return '';
  }

  return '';
}

function sanitizeLinkUrl(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith('/') && !trimmedValue.startsWith('//')) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue);

    if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    return '';
  }

  return '';
}

function sanitizeAttributeValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getAllowedAttributes(tagName: string, attributes: string): string {
  const allowedAttributes: string[] = [];
  const attributePattern = /([a-zA-Z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(attributes)) !== null) {
    const attributeName = match[1].toLowerCase();
    const attributeValue = match[3] ?? match[4] ?? match[5] ?? '';

    if (attributeName.startsWith('on')) {
      continue;
    }

    if (attributeName === 'data-editor-block' && ['figure', 'div'].includes(tagName)) {
      allowedAttributes.push(`data-editor-block="${sanitizeAttributeValue(attributeValue)}"`);
      continue;
    }

    if (
      attributeName.startsWith('data-') &&
      ['div', 'figure', 'p'].includes(tagName)
    ) {
      allowedAttributes.push(`${attributeName}="${sanitizeAttributeValue(attributeValue)}"`);
      continue;
    }

    if (attributeName === 'src' && ['audio', 'img', 'video'].includes(tagName)) {
      const safeUrl = sanitizeUrl(attributeValue);

      if (safeUrl) {
        allowedAttributes.push(`src="${sanitizeAttributeValue(safeUrl)}"`);
      }

      continue;
    }

    if (attributeName === 'src' && tagName === 'iframe') {
      const safeUrl = sanitizeEmbedUrl(attributeValue);

      if (safeUrl) {
        allowedAttributes.push(`src="${sanitizeAttributeValue(safeUrl)}"`);
      }

      continue;
    }

    if (attributeName === 'title' && tagName === 'iframe') {
      allowedAttributes.push(`title="${sanitizeAttributeValue(attributeValue)}"`);
      continue;
    }

    if (attributeName === 'loading' && ['iframe', 'img'].includes(tagName)) {
      allowedAttributes.push(`loading="${sanitizeAttributeValue(attributeValue)}"`);
      continue;
    }

    if (attributeName === 'allow' && tagName === 'iframe') {
      allowedAttributes.push(`allow="${sanitizeAttributeValue(attributeValue)}"`);
      continue;
    }

    if (attributeName === 'allowfullscreen' && tagName === 'iframe') {
      allowedAttributes.push('allowfullscreen');
      continue;
    }

    if (attributeName === 'alt' && tagName === 'img') {
      allowedAttributes.push(`alt="${sanitizeAttributeValue(attributeValue)}"`);
      continue;
    }

    if (attributeName === 'href' && tagName === 'a') {
      const safeUrl = sanitizeLinkUrl(attributeValue);

      if (safeUrl) {
        allowedAttributes.push(`href="${sanitizeAttributeValue(safeUrl)}"`);
      }

      continue;
    }

    if (attributeName === 'target' && tagName === 'a' && attributeValue === '_blank') {
      allowedAttributes.push('target="_blank"');
      continue;
    }

    if (attributeName === 'rel' && tagName === 'a') {
      allowedAttributes.push('rel="noopener noreferrer"');
      continue;
    }

    if (attributeName === 'kind' && tagName === 'track') {
      allowedAttributes.push(`kind="${sanitizeAttributeValue(attributeValue)}"`);
      continue;
    }

    if (attributeName === 'label' && tagName === 'track') {
      allowedAttributes.push(`label="${sanitizeAttributeValue(attributeValue)}"`);
      continue;
    }

    if (attributeName === 'srclang' && tagName === 'track') {
      allowedAttributes.push(`srclang="${sanitizeAttributeValue(attributeValue)}"`);
      continue;
    }

    if (attributeName === 'src' && tagName === 'track') {
      const safeUrl = sanitizeUrl(attributeValue);

      if (safeUrl) {
        allowedAttributes.push(`src="${sanitizeAttributeValue(safeUrl)}"`);
      }

      continue;
    }

    if (attributeName === 'controls' && ['audio', 'video'].includes(tagName)) {
      allowedAttributes.push('controls');
      continue;
    }

    if (attributeName === 'autoplay' && tagName === 'video') {
      allowedAttributes.push('autoplay');
      continue;
    }

    if (attributeName === 'muted' && tagName === 'video') {
      allowedAttributes.push('muted');
    }
  }

  return allowedAttributes.length > 0 ? ` ${allowedAttributes.join(' ')}` : '';
}

function sanitizeArticleHtml(content: string): string {
  const allowedTags = new Set([
    'a',
    'audio',
    'b',
    'br',
    'details',
    'div',
    'em',
    'figcaption',
    'figure',
    'i',
    'iframe',
    'img',
    'mark',
    'p',
    'strong',
    'table',
    'tbody',
    'td',
    'summary',
    'track',
    'tr',
    'u',
    'video',
  ]);

  return content
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<button\b[\s\S]*?<\/button>/gi, '')
    .replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (tag, rawTagName: string, attributes: string) => {
      const tagName = rawTagName.toLowerCase();

      if (!allowedTags.has(tagName)) {
        return '';
      }

      if (tag.startsWith('</')) {
        return tagName === 'br' || tagName === 'img' || tagName === 'track'
          ? ''
          : `</${tagName}>`;
      }

      const safeAttributes = getAllowedAttributes(tagName, attributes);

      return tagName === 'br' || tagName === 'img' || tagName === 'track'
        ? `<${tagName}${safeAttributes}>`
        : `<${tagName}${safeAttributes}>`;
    });
}

// 1. Fetch data from internal API route
async function getPostFromApi(id: string, token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store', // Always get fresh reactions & comments
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.post;
  } catch (error) {
    console.error("API fetch failed for article:", error);
    return null;
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  const articleId = getArticleIdFromSlug(slug);

  // Native Server-side Auth verification via Cookie Token
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/unauthorized'); // Kicks unauthenticated users out
  }

  const user = await verifyTokenWithBridge(token);

  if (!user) {
    redirect('/unauthorized'); // Kicks unauthenticated users out
  }

  // 2. Fetch post payload from API
  const post = await getPostFromApi(articleId, token);

  // Fallback if article is not found
  if (!post) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <HeaderV1S1 user={user} />

        <section className="mx-auto mt-16 max-w-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-rose-600">
            Missing Article
          </p>
          <h1 className="mt-4 text-3xl font-medium tracking-tight text-slate-950">
            Article Not Found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The article you are looking for does not exist or is no longer available.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-10 items-center justify-center border border-blue-300 px-4 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
          >
            Back to publications
          </Link>
        </section>
      </main>
    );
  }

  const canonicalSlug = getCanonicalArticleSlug(post);

  if (canonicalSlug !== slug) {
    redirect(`/article/${canonicalSlug}`);
  }

  // Format author display name safely (handles strings, objects, and email fallbacks)
  const authorDisplayName =
    typeof post.author === 'object' && post.author !== null
      ? post.author.username || post.author.email?.split('@')[0]
      : post.author;

  const commentsCount = post.comments?.length ?? 0;
  const likesCount = post.likes ?? post.reactions?.length ?? 0;
  const hasHtmlContent = isHtmlContent(post.content);
  const contentBlocks = getContentBlocks(post.content);
  const articleHtml = hasHtmlContent ? sanitizeArticleHtml(post.content) : '';

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased selection:bg-blue-200 selection:text-slate-950">
      <HeaderV1S1 user={user} />

      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-10 md:py-14">
        <article className="space-y-8">
          <header className="border-b border-slate-200 pb-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-rose-600">
              <span>@{authorDisplayName || 'Anonymous'}</span>
            </div>

            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-medium leading-tight tracking-tight text-slate-700">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-600">
              <span className="border border-slate-200 bg-slate-50 px-2.5 py-1">
                {likesCount} likes
              </span>
              <span className="border border-slate-200 bg-slate-50 px-2.5 py-1">
                {commentsCount} comments
              </span>
            </div>
          </header>

          {hasHtmlContent ? (
            <div
              className="article-content-html max-w-3xl font-serif text-[20px] font-medium leading-8 text-slate-600"
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />
          ) : (
            <div className="max-w-3xl space-y-6 font-serif text-[20px] font-medium leading-8 text-slate-600">
              {contentBlocks.map((block, index) => (
                <p key={index} className="whitespace-pre-line">
                  {block}
                </p>
              ))}
            </div>
          )}
        </article>

        <section className="border-t border-slate-200 pt-8">
          <div className="flex flex-col gap-8">
            <ReactionButton
              postId={post.id}
              initialLikes={likesCount}
              currentUser={user}
            />

            <CommentSection
              postId={post.id}
              comments={post.comments || []}
              currentUser={user}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
