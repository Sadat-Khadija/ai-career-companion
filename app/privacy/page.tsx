export default function PrivacyPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">Privacy & AI Use Notice</h1>
      <p className="text-gray-700">
        We store your job posts, AI analyses, and optional resume snippets in Supabase. Access is
        restricted to your account via row-level security. We never send your email, name, or user
        ID to the AI provider—only the job description and any resume text you explicitly submit.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-gray-700">
        <li>You can delete your job posts and analyses at any time from Settings.</li>
        <li>AI calls use Groq; content is processed to generate summaries and skill gaps.</li>
        <li>Do not paste sensitive personal data into job descriptions or resumes.</li>
      </ul>
    </div>
  );
}
