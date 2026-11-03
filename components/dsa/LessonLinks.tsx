import Link from "next/link";
import { GraduationCap } from "lucide-react";
import type { DSACategory } from "@/data/dsa";
import { PYTHON_LESSONS } from "@/data/python-course";
import { TOPIC_PYTHON_LESSONS } from "@/data/topic-links";

export function lessonsForTopic(topic: DSACategory) {
  return (TOPIC_PYTHON_LESSONS[topic] ?? []).flatMap(id => PYTHON_LESSONS.filter(lesson => lesson.id === id));
}

export function LessonLinks({ topic, className = "" }: { topic: DSACategory; className?: string }) {
  const lessons = lessonsForTopic(topic);
  if (!lessons.length) return null;
  return <p className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs ${className}`}>
    <span className="flex items-center gap-1 text-slate-500"><GraduationCap className="h-3.5 w-3.5" /> Brush up:</span>
    {lessons.map(lesson => <Link key={lesson.id} href={`/python-course?lesson=${encodeURIComponent(lesson.id)}`} className="text-[#c9e9a8] underline-offset-2 hover:text-white hover:underline">{lesson.title}</Link>)}
  </p>;
}
