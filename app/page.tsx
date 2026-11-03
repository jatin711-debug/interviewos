import { Dashboard } from "@/components/dashboard/Dashboard";
import { FLASHCARDS } from "@/data/cs_fundamentals";
import { DSA_PROBLEMS } from "@/data/dsa";
import { PYTHON_LESSONS } from "@/data/python-course";

// A Server Component: the full problem, flashcard and lesson content stays on the server and
// the dashboard only receives the ids it counts.
export default function DashboardPage() {
  return <Dashboard catalog={{
    problems: DSA_PROBLEMS.map(({ id, slug }) => ({ id, slug })),
    flashcards: FLASHCARDS.map(({ id, category }) => ({ id, category })),
    lessonIds: PYTHON_LESSONS.map(lesson => lesson.id),
  }} />;
}
