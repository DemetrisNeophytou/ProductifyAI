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
  type: "ebook" | "course" | "workbook";
  icon: string;
  sections: TemplateSection[];
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    id: "ebook-10-chapter",
    name: "Ebook (10 Chapters)",
    description: "Professional ebook with 10 comprehensive chapters",
    type: "ebook",
    icon: "BookOpen",
    sections: [
      { type: "introduction", title: "Introduction", order: 0 },
      { type: "chapter", title: "Chapter 1", order: 1 },
      { type: "chapter", title: "Chapter 2", order: 2 },
      { type: "chapter", title: "Chapter 3", order: 3 },
      { type: "chapter", title: "Chapter 4", order: 4 },
      { type: "chapter", title: "Chapter 5", order: 5 },
      { type: "chapter", title: "Chapter 6", order: 6 },
      { type: "chapter", title: "Chapter 7", order: 7 },
      { type: "chapter", title: "Chapter 8", order: 8 },
      { type: "chapter", title: "Chapter 9", order: 9 },
      { type: "chapter", title: "Chapter 10", order: 10 },
      { type: "conclusion", title: "Conclusion", order: 11 },
    ],
  },
  {
    id: "course-6-modules",
    name: "Online Course (6 Modules)",
    description: "Comprehensive course with 6 modules, 3 lessons each",
    type: "course",
    icon: "GraduationCap",
    sections: [
      { type: "module", title: "Module 1: Getting Started", order: 0 },
      { type: "lesson", title: "Lesson 1.1", order: 1 },
      { type: "lesson", title: "Lesson 1.2", order: 2 },
      { type: "lesson", title: "Lesson 1.3", order: 3 },
      { type: "module", title: "Module 2: Core Concepts", order: 4 },
      { type: "lesson", title: "Lesson 2.1", order: 5 },
      { type: "lesson", title: "Lesson 2.2", order: 6 },
      { type: "lesson", title: "Lesson 2.3", order: 7 },
      { type: "module", title: "Module 3: Advanced Techniques", order: 8 },
      { type: "lesson", title: "Lesson 3.1", order: 9 },
      { type: "lesson", title: "Lesson 3.2", order: 10 },
      { type: "lesson", title: "Lesson 3.3", order: 11 },
      { type: "module", title: "Module 4: Practical Applications", order: 12 },
      { type: "lesson", title: "Lesson 4.1", order: 13 },
      { type: "lesson", title: "Lesson 4.2", order: 14 },
      { type: "lesson", title: "Lesson 4.3", order: 15 },
      { type: "module", title: "Module 5: Case Studies", order: 16 },
      { type: "lesson", title: "Lesson 5.1", order: 17 },
      { type: "lesson", title: "Lesson 5.2", order: 18 },
      { type: "lesson", title: "Lesson 5.3", order: 19 },
      { type: "module", title: "Module 6: Next Steps", order: 20 },
      { type: "lesson", title: "Lesson 6.1", order: 21 },
      { type: "lesson", title: "Lesson 6.2", order: 22 },
      { type: "lesson", title: "Lesson 6.3", order: 23 },
    ],
  },
  {
    id: "workbook-interactive",
    name: "Interactive Workbook",
    description: "Hands-on workbook with exercises and worksheets",
    type: "workbook",
    icon: "FileText",
    sections: [
      { type: "overview", title: "How to Use This Workbook", order: 0 },
      { type: "assessment", title: "Self-Assessment", order: 1 },
      { type: "worksheet", title: "Worksheet 1: Goal Setting", order: 2 },
      { type: "worksheet", title: "Worksheet 2: Planning", order: 3 },
      { type: "worksheet", title: "Worksheet 3: Action Steps", order: 4 },
      { type: "worksheet", title: "Worksheet 4: Resources", order: 5 },
      { type: "worksheet", title: "Worksheet 5: Tracking Progress", order: 6 },
      { type: "reflection", title: "Reflection & Next Steps", order: 7 },
    ],
  },
];
