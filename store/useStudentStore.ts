import { create } from "zustand";

export type TopicProgress = {
  id: string;
  isCompleted: boolean;
};

export type CourseSolvedQuestions = Record<string, number>;

export type MockExamCourseResult = {
  courseKey: string;
  correct: number;
  wrong: number;
  empty: number;
};

export type MockExam = {
  id: string;
  name: string;
  type: "TYT" | "AYT";
  date: string;
  courses: MockExamCourseResult[];
};

export type Student = {
  _id?: string;
  name: string;
  target: string;
  topics: TopicProgress[];
  weeklySelectedTopics: string[];
  solvedQuestionsByCourse: CourseSolvedQuestions;
  weeklySolvedQuestionsByCourse: CourseSolvedQuestions;
  mockExams: MockExam[];
};

type StudentStore = {
  students: Student[];
  currentStudent: Student | null;
  isAddModalOpen: boolean;
  editingStudent: Student | null;
  setAddModalOpen: (isOpen: boolean) => void;
  setEditingStudent: (student: Student | null) => void;
  addStudent: (student: Student) => void;
  setStudents: (students: Student[]) => void;
  setCurrentStudent: (student: Student | null) => void;
  updateCurrentStudent: (updates: Partial<Student>) => void;
  updateStudent: (student: Student) => void;
  removeStudent: (studentId: string) => void;
};

export const useStudentStore = create<StudentStore>((set) => ({
  students: [],
  currentStudent: null,
  isAddModalOpen: false,
  editingStudent: null,
  setAddModalOpen: (isOpen) => set({ isAddModalOpen: isOpen }),
  setEditingStudent: (student) => set({ editingStudent: student }),
  addStudent: (student) =>
    set((state) => ({ students: [...state.students, student] })),
  setStudents: (students) => set({ students }),
  setCurrentStudent: (student) => set({ currentStudent: student }),
  updateCurrentStudent: (updates) =>
    set((state) =>
      state.currentStudent
        ? { currentStudent: { ...state.currentStudent, ...updates } }
        : {},
    ),
  updateStudent: (student) =>
    set((state) => ({
      students: state.students.map((s) =>
        s._id === student._id ? student : s,
      ),
      currentStudent:
        state.currentStudent?._id === student._id
          ? student
          : state.currentStudent,
    })),
  removeStudent: (studentId) =>
    set((state) => ({
      students: state.students.filter((s) => s._id !== studentId),
      currentStudent:
        state.currentStudent?._id === studentId ? null : state.currentStudent,
    })),
}));
