import { useState, useEffect } from react;
import { useParams, useNavigate } from react-router-dom;
import { ArrowLeft, Plus, MoreHorizontal, Users, Calendar, ClipboardList, ChevronDown, Search } from lucide-react;
import { issueApi, projectApi, userApi, sprintApi } from ../services/api;
import toast from react-hot-toast;

interface Issue {
  id: string;
  key: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  sprintId: string | null;
  projectId: string;
}

interface Project {
  id: string;
  key: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
}

const statusColumns = [
  { id: BACKLOG, label: Backlog, color: bg-gray-100