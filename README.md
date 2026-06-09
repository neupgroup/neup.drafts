# Multi-Feature Content & Translation Portal

A Next.js application built from scratch inside the `src` directory to prototype a content ecosystem featuring server-side protected user accounts, article viewing, interactive engagement tools, and dynamic language translation.

## 📁 Project Structure & Features

### 🌐 Pages & API Routes
* `src/app/account/page.tsx` - User profile dashboard with server-side authentication.
* `src/app/article/page.tsx` - Article viewing page integrated with engagement components.
* `src/app/translation/page.tsx` - Dedicated translation utility dashboard.
* `src/app/api/auth/callback/route.ts` - OAuth/Auth bridge callback handler route.
* `src/app/api/posts/route.ts` - API backend for fetching and updating article data.
* `src/app/api/translate/route.ts` - API route handling translation requests.

### 🧩 Core UI Components
* `CommentSection.tsx` - Interactive client-side component for posting and viewing user feedback.
* `ReactionButton.tsx` - Engagement widget for liking/reacting to content.
* `TranslationWidget.tsx` - Dropdown/input interface hook to change text languages dynamically.

### 🛡️ Authentication & Utilities
* `auth-guard.ts` - Helper utility/wrapper to protect private routes.
* `bridge-auth.service.ts` - Service layer handling token validation against the auth bridge.

---

## 🚀 Getting Started

### 1. Installation
Install the project dependencies:

```bash
npm install

### 2. Local Development
Start the local server:

```bash
npm run dev

Open http://localhost:3000 to view the application.

## 🧪 How to Test with Mock Data

To test the frontend layouts and interactive components locally without relying on live backend API databases or server sessions, follow these quick-injection steps:

### 1. Account Dashboard (`src/app/account/page.tsx`)

**Goal:** Bypass the live Auth Bridge server check to instantly preview the user profile dashboard layout.

To switch the page from **Production/Live Mode** into **UI Testing Mode**, modify the top of the file as follows:

1. **Disable the live auth hooks:** Comment out the `cookies` and `verifyTokenWithBridge` imports at the top of the file, along with the token extraction variables inside the function component.
2. **Enable the prototype user:** Uncomment the hardcoded `const user` object to override the live system.

#### Code Configuration:
```typescript
// 1. Comment out live authentication infrastructure
// import { cookies } from 'next/headers';
// import { verifyTokenWithBridge } from '@/lib/bridge-auth.service';

export default async function AccountPage() {
  // const cookieStore = await cookies();
  // const token = cookieStore.get('auth_token')?.value;
  // const user = token ? await verifyTokenWithBridge(token) : null;

  // 2. Uncomment this block to force-inject the prototype user session
  const user = { 
    username: "Prototype Tester", 
    role: "clerk",
    id: 123
  };
  
  // ... rest of the component remains unchanged
}

### 2. Article & Engagement Page (`src/app/article/page.tsx`)

**Goal:** Bypass dynamic routing parameters (`params.id`) and database lookups to instantly render a sample article layout equipped with active reaction buttons and comment fields.

To switch the article view into **UI Testing Mode**, modify the file setup to look like this:

1. **Disable dynamic route lookups:** Comment out the `params` argument in the function signature and the `blogPosts.find()` lookup variable.
2. **Inject a static fallback payload:** Assign a hardcoded `post` object directly so the page renders without requiring a specific URL ID string.

#### Code Configuration:
```typescript
// 1. Clear the parameters argument for static testing
export default async function ArticlePage() {
  
  // 2. Comment out the active file-tree lookup array
  // const post = blogPosts.find((p) => p.id === Number(params.id)) as BlogPost | undefined;

  // 3. Force-inject this mock post payload structure
  const post = {
    id: 1,
    title: "Prototyping Next.js Ecosystems",
    author: "Core Team Developer",
    content: "This is a sample article body rendered locally to review UI typography, spacing, and element alignment structures.",
    likes: 42,
    comments: [
      { id: 101, text: "This looks fantastic! The components load fast." },
      { id: 102, text: "Testing the server-to-client component data bridge." }
    ]
  };

  if (!post) { notFound(); } // Will be skipped securely

  return (
    <main className="max-w-2xl mx-auto p-6 mt-6">
      <h1 className="text-3xl font-extrabold text-gray-900">{post.title}</h1>
      <p className="text-xs text-gray-400 mt-1">Written by @{post.author}</p>
      <div className="mt-4 text-gray-700 leading-relaxed text-base">{post.content}</div>

      {/* Renders UI interactive blocks instantly with the dummy data */}
      <ReactionButton postId={post.id} initialLikes={post.likes || 0} />
      <CommentSection postId={post.id} comments={post.comments || []} />
    </main>
  );
}

### 3. Translation Dashboard (`src/app/translation/page.tsx`)

**Goal:** Bypass the session gatekeeper to test the interactive text translation client widgets without requiring an authenticated browser session.

To switch the translation portal into **UI Testing Mode**, modify the top of the file as follows:

1. **Disable the token verification:** Comment out the `cookies`, token string extractions, and live `verifyTokenWithBridge` handler variables.
2. **Inject a mock session string:** Force-define a local static `user` object matching the `BridgeUser` interface layout definitions.

#### Code Configuration:
```typescript
export default async function TranslationPage() {
  // 1. Comment out the active cookie validation engine
  // const cookieStore = await cookies();
  // const token = cookieStore.get('auth_token')?.value;
  // const user: BridgeUser | null = token ? await verifyTokenWithBridge(token) : null;

  // 2. Force-inject an authenticated user session profile mock
  const user = {
    username: "Translation Tester",
    id: "999",
    email: "tester@portal.local"
  };

  // The 'if (!user)' security blocker will now be skipped automatically safely.

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Translation Tools</h1>
      <p className="text-sm text-green-600 mb-6">✓ Authenticated as: {user.username}</p>
      
      {/* Renders the interactive layout panels immediately */}
      <TranslationWidget />
    </main>
  );
}