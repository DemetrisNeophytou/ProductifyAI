// Template definitions for digital products

export interface TemplateSection {
  type: string;
  title: string;
  order: number;
}

export interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  type: "ebook" | "course" | "workbook" | "checklist" | "leadmagnet" | "template";
  icon: string;
  sections: TemplateSection[];
  exportFormats: string[];
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    id: "ebook-10-chapter",
    name: "Ebook (10 Chapters)",
    description: "Professional ebook with 10 comprehensive chapters",
    type: "ebook",
    icon: "BookOpen",
    exportFormats: ["PDF"],
    sections: [
      { type: "cover", title: "Cover", order: 0 },
      { type: "introduction", title: "Introduction", order: 1 },
      { type: "chapter", title: "Chapter 1", order: 2 },
      { type: "chapter", title: "Chapter 2", order: 3 },
      { type: "chapter", title: "Chapter 3", order: 4 },
      { type: "chapter", title: "Chapter 4", order: 5 },
      { type: "chapter", title: "Chapter 5", order: 6 },
      { type: "chapter", title: "Chapter 6", order: 7 },
      { type: "chapter", title: "Chapter 7", order: 8 },
      { type: "chapter", title: "Chapter 8", order: 9 },
      { type: "chapter", title: "Chapter 9", order: 10 },
      { type: "chapter", title: "Chapter 10", order: 11 },
      { type: "conclusion", title: "Conclusion", order: 12 },
      { type: "about", title: "About the Author", order: 13 },
    ],
  },
  {
    id: "course-6-modules",
    name: "Online Course (6 Modules)",
    description: "Comprehensive course with 6 modules, 3 lessons each",
    type: "course",
    icon: "GraduationCap",
    exportFormats: ["HTML", "PDF"],
    sections: [
      { type: "overview", title: "Course Overview", order: 0 },
      { type: "module", title: "Module 1: Getting Started", order: 1 },
      { type: "lesson", title: "Lesson 1.1", order: 2 },
      { type: "lesson", title: "Lesson 1.2", order: 3 },
      { type: "lesson", title: "Lesson 1.3", order: 4 },
      { type: "resources", title: "Module 1 Resources", order: 5 },
      { type: "quiz", title: "Module 1 Quiz", order: 6 },
      { type: "module", title: "Module 2: Core Concepts", order: 7 },
      { type: "lesson", title: "Lesson 2.1", order: 8 },
      { type: "lesson", title: "Lesson 2.2", order: 9 },
      { type: "lesson", title: "Lesson 2.3", order: 10 },
      { type: "resources", title: "Module 2 Resources", order: 11 },
      { type: "quiz", title: "Module 2 Quiz", order: 12 },
      { type: "module", title: "Module 3: Advanced Techniques", order: 13 },
      { type: "lesson", title: "Lesson 3.1", order: 14 },
      { type: "lesson", title: "Lesson 3.2", order: 15 },
      { type: "lesson", title: "Lesson 3.3", order: 16 },
      { type: "resources", title: "Module 3 Resources", order: 17 },
      { type: "quiz", title: "Module 3 Quiz", order: 18 },
      { type: "module", title: "Module 4: Practical Applications", order: 19 },
      { type: "lesson", title: "Lesson 4.1", order: 20 },
      { type: "lesson", title: "Lesson 4.2", order: 21 },
      { type: "lesson", title: "Lesson 4.3", order: 22 },
      { type: "resources", title: "Module 4 Resources", order: 23 },
      { type: "quiz", title: "Module 4 Quiz", order: 24 },
      { type: "module", title: "Module 5: Case Studies", order: 25 },
      { type: "lesson", title: "Lesson 5.1", order: 26 },
      { type: "lesson", title: "Lesson 5.2", order: 27 },
      { type: "lesson", title: "Lesson 5.3", order: 28 },
      { type: "resources", title: "Module 5 Resources", order: 29 },
      { type: "quiz", title: "Module 5 Quiz", order: 30 },
      { type: "module", title: "Module 6: Next Steps", order: 31 },
      { type: "lesson", title: "Lesson 6.1", order: 32 },
      { type: "lesson", title: "Lesson 6.2", order: 33 },
      { type: "lesson", title: "Lesson 6.3", order: 34 },
      { type: "resources", title: "Module 6 Resources", order: 35 },
      { type: "quiz", title: "Module 6 Quiz", order: 36 },
    ],
  },
  {
    id: "workbook-interactive",
    name: "Interactive Workbook",
    description: "Hands-on workbook with exercises and worksheets",
    type: "workbook",
    icon: "FileText",
    exportFormats: ["PDF"],
    sections: [
      { type: "cover", title: "Cover", order: 0 },
      { type: "overview", title: "How to Use This Workbook", order: 1 },
      { type: "worksheet", title: "Worksheet 1: Goal Setting", order: 2 },
      { type: "exercise", title: "Exercise 1: Define Your Goals", order: 3 },
      { type: "worksheet", title: "Worksheet 2: Planning", order: 4 },
      { type: "exercise", title: "Exercise 2: Create Action Plan", order: 5 },
      { type: "worksheet", title: "Worksheet 3: Resources", order: 6 },
      { type: "exercise", title: "Exercise 3: Gather Resources", order: 7 },
      { type: "notes", title: "Notes & Reflections", order: 8 },
    ],
  },
  {
    id: "checklist-simple",
    name: "Action Checklist",
    description: "Step-by-step checklist guide",
    type: "checklist",
    icon: "ListChecks",
    exportFormats: ["PDF", "PNG"],
    sections: [
      { type: "intro", title: "Introduction", order: 0 },
      { type: "checklist", title: "Checklist Items", order: 1 },
      { type: "tips", title: "Pro Tips", order: 2 },
      { type: "cta", title: "Next Steps", order: 3 },
    ],
  },
  {
    id: "leadmagnet-simple",
    name: "Lead Magnet",
    description: "High-value lead magnet to grow your list",
    type: "leadmagnet",
    icon: "Magnet",
    exportFormats: ["PDF", "PNG"],
    sections: [
      { type: "hook", title: "Hook", order: 0 },
      { type: "value", title: "Value Proposition", order: 1 },
      { type: "steps", title: "Action Steps", order: 2 },
      { type: "cta", title: "Call to Action", order: 3 },
    ],
  },
  {
    id: "template-design",
    name: "Design Template",
    description: "Customizable design template",
    type: "template",
    icon: "Layout",
    exportFormats: ["PNG", "ZIP"],
    sections: [
      { type: "preview", title: "Template Preview", order: 0 },
      { type: "blocks", title: "Design Blocks", order: 1 },
      { type: "usage", title: "Usage Instructions", order: 2 },
    ],
  },
];
