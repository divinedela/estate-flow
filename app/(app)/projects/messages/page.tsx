import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  FolderIcon,
  BellAlertIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";

interface Message {
  id: string;
  project_id: string;
  project_name: string;
  sender_name: string;
  message_type: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

async function getProjectMessages() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      messages: [] as Message[],
      unreadCount: 0,
      announcementCount: 0,
      discussionCount: 0,
    };
  }

  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) {
    return {
      messages: [] as Message[],
      unreadCount: 0,
      announcementCount: 0,
      discussionCount: 0,
    };
  }

  // Mock data for now
  const mockMessages: Message[] = [];

  const unreadCount = mockMessages.filter((m) => !m.is_read).length;
  const announcementCount = mockMessages.filter(
    (m) => m.message_type === "announcement"
  ).length;
  const discussionCount = mockMessages.filter(
    (m) => m.message_type === "discussion"
  ).length;

  return {
    messages: mockMessages,
    unreadCount,
    announcementCount,
    discussionCount,
  };
}

export default async function MessagesPage() {
  const data = await getProjectMessages();

  const messageTypeColors: Record<string, string> = {
    announcement: "bg-blue-100 text-blue-800 border-blue-300",
    discussion: "bg-purple-100 text-purple-800 border-purple-300",
    update: "bg-green-100 text-green-800 border-green-300",
    question: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };

  const messageTypeIcons: Record<string, any> = {
    announcement: MegaphoneIcon,
    discussion: ChatBubbleLeftRightIcon,
    update: BellAlertIcon,
    question: ChatBubbleLeftRightIcon,
  };

  return (
    <RoleGuard
      allowedRoles={[
        "super_admin",
        "project_manager",
        "site_engineer",
        "executive",
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Project Communication
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Team discussions and project announcements
            </p>
          </div>
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            New Message
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Messages
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.messages.length}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <BellAlertIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unread</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.unreadCount}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <MegaphoneIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Announcements
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.announcementCount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Message List */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>All Messages</option>
                <option>Unread</option>
                <option>Announcements</option>
                <option>Discussions</option>
              </select>
            </div>

            {data.messages.length === 0 ? (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No messages
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start a conversation with your team.
                </p>
                <div className="mt-6">
                  <Button className="inline-flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Message
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {data.messages.map((message) => {
                  const TypeIcon =
                    messageTypeIcons[message.message_type] ||
                    ChatBubbleLeftRightIcon;
                  return (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg hover:border-indigo-300 transition-colors cursor-pointer ${
                        message.is_read
                          ? "bg-white"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">
                                {message.sender_name}
                              </p>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                                  messageTypeColors[message.message_type]
                                }`}
                              >
                                <TypeIcon className="h-3 w-3 mr-1" />
                                {message.message_type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {message.subject}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {message.content}
                          </p>
                          <div className="flex items-center mt-2">
                            <FolderIcon className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {message.project_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Compose Message */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Message
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Select project</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="discussion">Discussion</option>
                  <option value="announcement">Announcement</option>
                  <option value="update">Update</option>
                  <option value="question">Question</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Message subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={6}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <Button className="w-full">
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                Send Message
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {data.messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent activity
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                Activity feed will appear here
              </div>
            )}
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
